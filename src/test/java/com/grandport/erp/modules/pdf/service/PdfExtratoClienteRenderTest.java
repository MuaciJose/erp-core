package com.grandport.erp.modules.pdf.service;

import com.grandport.erp.modules.configuracoes.service.LayoutPreviewDataService;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;

class PdfExtratoClienteRenderTest {

    private final PdfService pdfService = new PdfService();
    private final LayoutPreviewDataService layoutPreviewDataService = new LayoutPreviewDataService();

    @Test
    void deveRenderizarTodosOsTemplatesDaBibliotecaDeExtratoCliente() throws Exception {
        Map<String, Object> variaveis = layoutPreviewDataService.buildPreviewVariables("extratoCliente");

        for (String styleId : new String[]{
                "01-executivo",
                "02-corporativo",
                "03-automotivo",
                "04-minimalista",
                "05-signature"
        }) {
            String html = Files.readString(Path.of("TEMPLATES_PREMIUM_IMPRESSAO/extrato_cliente/" + styleId + ".html"));
            String htmlProcessado = pdfService.processTemplate(html, variaveis);
            assertFalse(htmlProcessado.isBlank(), "HTML processado vazio para o estilo " + styleId);
        }
    }
}
