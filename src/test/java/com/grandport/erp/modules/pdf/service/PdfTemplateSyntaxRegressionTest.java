package com.grandport.erp.modules.pdf.service;

import com.grandport.erp.modules.configuracoes.service.LayoutPreviewDataService;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;

class PdfTemplateSyntaxRegressionTest {

    private final PdfService pdfService = new PdfService();
    private final LayoutPreviewDataService layoutPreviewDataService = new LayoutPreviewDataService();

    @Test
    void deveProcessarTodosOsTemplatesHtmlOficiaisESemErrosDeThymeleaf() throws Exception {
        assertAllTemplatesUnder(Path.of("src/main/resources/default-templates"));
    }

    @Test
    void deveProcessarTodosOsTemplatesHtmlDaBibliotecaPremiumSemErrosDeThymeleaf() throws Exception {
        assertAllTemplatesUnder(Path.of("TEMPLATES_PREMIUM_IMPRESSAO"));
    }

    private void assertAllTemplatesUnder(Path root) throws Exception {
        try (Stream<Path> files = Files.walk(root)) {
            files.filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".html"))
                    .forEach(this::assertTemplate);
        }
    }

    private void assertTemplate(Path path) {
        try {
            String tipoLayout = resolveLayoutType(path);
            Map<String, Object> variaveis = layoutPreviewDataService.buildPreviewVariables(tipoLayout);
            String html = Files.readString(path);
            String htmlProcessado = pdfService.processTemplate(html, variaveis);
            assertFalse(htmlProcessado.isBlank(), "HTML processado vazio para " + path);
        } catch (Exception e) {
            throw new AssertionError("Falha ao processar template " + path + ": " + e.getMessage(), e);
        }
    }

    private String resolveLayoutType(Path path) throws IOException {
        Path parent = path.getParent();
        if (parent == null) {
            throw new IOException("Path sem parent: " + path);
        }

        String parentName = parent.getFileName().toString();
        if ("default-templates".equals(parentName)) {
            return switch (path.getFileName().toString()) {
                case "os.html" -> "os";
                case "venda.html" -> "venda";
                case "recibo.html" -> "recibo";
                case "recibo-pagamento.html" -> "reciboPagamento";
                case "fechamento-caixa.html" -> "fechamentoCaixa";
                case "espelho-nota.html" -> "espelhoNota";
                case "dre.html" -> "dre";
                case "relatorio-comissao.html" -> "relatorioComissao";
                case "relatorio-contas-pagar.html" -> "relatorioContasPagar";
                case "relatorio-contas-receber.html" -> "relatorioContasReceber";
                case "extrato-cliente.html" -> "extratoCliente";
                case "extrato-fornecedor.html" -> "extratoFornecedor";
                default -> throw new IOException("Template default sem mapeamento: " + path);
            };
        }

        if ("KIT_PADRAO_PREMIUM".equals(parentName)) {
            Path moduleDir = parent.getParent();
            if (moduleDir == null) {
                throw new IOException("Kit premium sem pasta de módulo: " + path);
            }
            return normalizeModuleName(moduleDir.getFileName().toString());
        }

        return normalizeModuleName(parentName);
    }

    private String normalizeModuleName(String rawName) {
        return switch (rawName) {
            case "recibo_pagamento" -> "reciboPagamento";
            case "fechamento_caixa" -> "fechamentoCaixa";
            case "espelho_nota" -> "espelhoNota";
            case "relatorio_comissao" -> "relatorioComissao";
            case "relatorio_contas_pagar" -> "relatorioContasPagar";
            case "relatorio_contas_receber" -> "relatorioContasReceber";
            case "extrato_cliente" -> "extratoCliente";
            case "extrato_fornecedor" -> "extratoFornecedor";
            default -> rawName;
        };
    }
}
