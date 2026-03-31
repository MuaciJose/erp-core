package com.grandport.erp.modules.pdf.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class PdfService {

    private static final Pattern FONT_FAMILY_PATTERN = Pattern.compile("(?i)(font-family\\s*:\\s*)([^;}{]+)");
    private static final Pattern STSONG_PATTERN = Pattern.compile("(?i)'?STSong-Light'?(\\s*,\\s*BoldItalic)?");
    private static final Pattern UNIGB_PATTERN = Pattern.compile("(?i)'?UniGB-UCS2-H'?");
    private static final Pattern FONT_FACE_BLOCK_PATTERN = Pattern.compile("(?is)@font-face\\s*\\{.*?(STSong-Light|UniGB-UCS2-H).*?\\}");
    private static final Pattern TH_TEXT_PATTERN = Pattern.compile("th:text=\"([^\"]+)\"");
    private static final Pattern THYMELEAF_EXPRESSION_PATTERN = Pattern.compile("\\$\\{([^}]+)}");
    private static final Pattern CONCAT_TOKEN_PATTERN = Pattern.compile("(\\$\\{[^}]+}|'[^']*')");

    // Criamos um motor especial só para ler Texto (String) do Banco de Dados
    private final TemplateEngine stringTemplateEngine;

    public PdfService() {
        this.stringTemplateEngine = new TemplateEngine();
        this.stringTemplateEngine.setTemplateResolver(new StringTemplateResolver());
    }

    // 🚀 NOVO MÉTODO: Recebe o TEXTO HTML direto do banco, não o nome do arquivo!
    public byte[] gerarPdfDeStringHtml(String htmlTemplate, Map<String, Object> variaveis) {
        String htmlProcessado = processTemplate(htmlTemplate, variaveis);

        // 3. Pega esse HTML final e transforma num arquivo PDF blindado
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            renderPdf(htmlProcessado, outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            if (isUnsupportedFontError(e)) {
                String htmlNormalizado = normalizarFontesParaPdf(htmlProcessado);
                log.warn("Fonte incompatível detectada no HTML do PDF. Aplicando fallback de fontes seguras.");

                try (ByteArrayOutputStream fallbackOutputStream = new ByteArrayOutputStream()) {
                    renderPdf(htmlNormalizado, fallbackOutputStream);
                    return fallbackOutputStream.toByteArray();
                } catch (Exception fallbackException) {
                    throw new RuntimeException("Falha ao gerar o PDF após fallback de fontes: " + fallbackException.getMessage(), fallbackException);
                }
            }

            throw new RuntimeException("Falha ao gerar o PDF da OS: " + e.getMessage(), e);
        }
    }

    String processTemplate(String htmlTemplate, Map<String, Object> variaveis) {
        Context context = new Context();
        context.setVariables(variaveis);

        String htmlNormalizado = normalizarExpressoesThymeleaf(htmlTemplate);
        return stringTemplateEngine.process(htmlNormalizado, context);
    }

    private void renderPdf(String htmlProcessado, ByteArrayOutputStream outputStream) throws Exception {
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(htmlProcessado);
        renderer.layout();
        renderer.createPDF(outputStream);
    }

    private boolean isUnsupportedFontError(Exception exception) {
        String message = exception.getMessage();
        return message != null
                && message.toLowerCase().contains("font")
                && message.toLowerCase().contains("not recognized");
    }

    private String normalizarFontesParaPdf(String html) {
        String sanitizedHtml = FONT_FACE_BLOCK_PATTERN.matcher(html).replaceAll("");
        sanitizedHtml = STSONG_PATTERN.matcher(sanitizedHtml).replaceAll("Helvetica");
        sanitizedHtml = UNIGB_PATTERN.matcher(sanitizedHtml).replaceAll("Identity-H");

        Matcher matcher = FONT_FAMILY_PATTERN.matcher(sanitizedHtml);
        StringBuffer normalizedHtml = new StringBuffer();

        while (matcher.find()) {
            String normalizedFont = matcher.group(1) + resolveSafeFontStack(matcher.group(2));
            matcher.appendReplacement(normalizedHtml, Matcher.quoteReplacement(normalizedFont));
        }

        matcher.appendTail(normalizedHtml);
        return normalizedHtml.toString();
    }

    private String normalizarExpressoesThymeleaf(String htmlTemplate) {
        Matcher matcher = TH_TEXT_PATTERN.matcher(htmlTemplate);
        StringBuffer normalizedHtml = new StringBuffer();

        while (matcher.find()) {
            String originalValue = matcher.group(1);
            String normalizedValue = normalizeThTextValue(originalValue);
            matcher.appendReplacement(normalizedHtml, Matcher.quoteReplacement("th:text=\"" + normalizedValue + "\""));
        }

        matcher.appendTail(normalizedHtml);
        return normalizedHtml.toString();
    }

    private String normalizeThTextValue(String originalValue) {
        if (originalValue == null || originalValue.isBlank()) {
            return originalValue;
        }

        String trimmedValue = originalValue.trim();

        if (trimmedValue.startsWith("|") && trimmedValue.endsWith("|")) {
            return convertLiteralSubstitution(trimmedValue.substring(1, trimmedValue.length() - 1));
        }

        if (shouldNormalizeBrokenConcatenation(trimmedValue)) {
            return convertBrokenConcatenation(trimmedValue);
        }

        return originalValue;
    }

    private boolean shouldNormalizeBrokenConcatenation(String value) {
        int expressionCount = countOccurrences(value, "${");
        return expressionCount > 1 || (expressionCount > 0 && value.startsWith("'"));
    }

    private int countOccurrences(String value, String token) {
        int count = 0;
        int index = 0;
        while ((index = value.indexOf(token, index)) >= 0) {
            count++;
            index += token.length();
        }
        return count;
    }

    private String convertLiteralSubstitution(String innerValue) {
        Matcher matcher = THYMELEAF_EXPRESSION_PATTERN.matcher(innerValue);
        List<String> tokens = new ArrayList<>();
        int lastIndex = 0;

        while (matcher.find()) {
            addLiteralToken(tokens, innerValue.substring(lastIndex, matcher.start()));
            tokens.add(matcher.group(1).trim());
            lastIndex = matcher.end();
        }

        addLiteralToken(tokens, innerValue.substring(lastIndex));
        return wrapAsThymeleafExpression(tokens);
    }

    private String convertBrokenConcatenation(String value) {
        Matcher matcher = CONCAT_TOKEN_PATTERN.matcher(value);
        List<String> tokens = new ArrayList<>();

        while (matcher.find()) {
            String token = matcher.group(1);
            if (token.startsWith("${")) {
                tokens.add(token.substring(2, token.length() - 1).trim());
            } else {
                tokens.add(token);
            }
        }

        return wrapAsThymeleafExpression(tokens);
    }

    private void addLiteralToken(List<String> tokens, String literal) {
        if (literal == null || literal.isEmpty()) {
            return;
        }
        tokens.add("'" + literal.replace("'", "\\'") + "'");
    }

    private String wrapAsThymeleafExpression(List<String> tokens) {
        return "${" + String.join(" + ", tokens) + "}";
    }

    private String resolveSafeFontStack(String originalFontValue) {
        String normalizedValue = originalFontValue.toLowerCase();

        if (normalizedValue.contains("courier") || normalizedValue.contains("monospace")) {
            return "'Courier New', Courier, monospace";
        }

        if (normalizedValue.contains("times") || normalizedValue.contains("serif")) {
            return "'Times New Roman', Times, serif";
        }

        return "Helvetica, Arial, sans-serif";
    }
}
