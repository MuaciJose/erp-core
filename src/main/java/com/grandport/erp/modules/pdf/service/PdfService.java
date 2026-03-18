package com.grandport.erp.modules.pdf.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfService {

    @Autowired
    private TemplateEngine templateEngine;

    public byte[] gerarPdfDeHtml(String nomeDoArquivoHtml, Map<String, Object> variaveis) {
        // 1. Entrega os dados (variáveis) para o Thymeleaf
        Context context = new Context();
        context.setVariables(variaveis);

        // 2. Pega o HTML cru e injeta os dados reais dentro dele
        String htmlProcessado = templateEngine.process(nomeDoArquivoHtml, context);

        // 3. Pega esse HTML final e transforma num arquivo PDF
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlProcessado);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Falha ao gerar o PDF: " + e.getMessage());
        }
    }
}