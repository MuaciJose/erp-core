package com.grandport.erp.modules.pdf.service;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfService {

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
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlProcessado);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Falha ao gerar o PDF da OS: " + e.getMessage());
        }
    }
}