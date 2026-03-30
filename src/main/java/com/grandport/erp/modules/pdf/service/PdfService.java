package com.grandport.erp.modules.pdf.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
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

    // Criamos um motor especial só para ler Texto (String) do Banco de Dados
    private final TemplateEngine stringTemplateEngine;

    public PdfService() {
        this.stringTemplateEngine = new TemplateEngine();
        this.stringTemplateEngine.setTemplateResolver(new StringTemplateResolver());
    }

    // 🚀 NOVO MÉTODO: Recebe o TEXTO HTML direto do banco, não o nome do arquivo!
    public byte[] gerarPdfDeStringHtml(String htmlTemplate, Map<String, Object> variaveis) {
        // 1. Entrega os dados (variáveis) para o Thymeleaf
        Context context = new Context();
        context.setVariables(variaveis);

        // 2. Pega o HTML CRU do banco e injeta os dados da OS dentro dele
        String htmlProcessado = stringTemplateEngine.process(htmlTemplate, context);

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
