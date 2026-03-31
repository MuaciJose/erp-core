package com.grandport.erp.modules.configuracoes.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class LayoutTemplateGovernanceService {

    private static final int MAX_TEMPLATE_SIZE = 120_000;
    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?i)<\\s*script");
    private static final Pattern IFRAME_PATTERN = Pattern.compile("(?i)<\\s*iframe");
    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile("(?i)on[a-z]+\\s*=");
    private static final Pattern REMOTE_ASSET_PATTERN = Pattern.compile("(?i)(src|href)\\s*=\\s*[\"']https?://");
    private static final Pattern STSONG_PATTERN = Pattern.compile("(?i)STSong-Light|UniGB-UCS2-H");
    private static final Pattern FONT_FACE_PATTERN = Pattern.compile("(?i)@font-face");

    private static final Map<String, LayoutMetadata> METADATA_BY_TYPE = Map.ofEntries(
            Map.entry("extratocliente", new LayoutMetadata(
                    "Extrato de Cliente",
                    List.of("empresa", "parceiro", "contas", "totalPendente", "totalRecebido", "totalGeral", "dataInicio", "dataFim", "dataEmissao"),
                    List.of("Use apenas fontes homologadas.", "Prefira tabelas simples e blocos legíveis para A4.")
            )),
            Map.entry("extratofornecedor", new LayoutMetadata(
                    "Extrato de Fornecedor",
                    List.of("empresa", "parceiro", "contas", "totalPendente", "totalPago", "totalGeral", "dataInicio", "dataFim", "dataEmissao"),
                    List.of("Use apenas fontes homologadas.", "Prefira tabelas simples e blocos legíveis para A4.")
            )),
            Map.entry("os", new LayoutMetadata(
                    "Ordem de Serviço",
                    List.of("empresa", "os", "numeroOs", "nomeCliente", "telefoneCliente", "nomeConsultor", "veiculoNome", "placaVeiculo", "kmEntrada", "kmEntradaDisplay", "imprimirLaudo"),
                    List.of("Este layout é usado em PDF e também em envio por WhatsApp.", "Evite dependência de scripts ou assets externos.")
            )),
            Map.entry("venda", new LayoutMetadata(
                    "Pedido de Venda",
                    List.of("empresa", "venda", "isOrcamento", "nomeCliente", "nomeVendedor", "kmVeiculo", "kmVeiculoDisplay", "imprimirObs"),
                    List.of("O mesmo documento pode representar orçamento ou pedido.", "Evite regras visuais dependentes de JavaScript.")
            )),
            Map.entry("recibo", new LayoutMetadata(
                    "Recibo",
                    List.of("empresa", "conta", "clienteNome", "valorConta", "dataEmissao", "dados", "dataFormatada"),
                    List.of("O layout é reutilizado por recibo avulso e recibo de recebimento.", "Considere condicional Thymeleaf para variações de uso.")
            )),
            Map.entry("recibopagamento", new LayoutMetadata(
                    "Recibo de Pagamento",
                    List.of("empresa", "conta", "fornecedorNome", "valorConta", "dataEmissao"),
                    List.of("Preferir layout de bobina ou A4 simplificado.", "Não use fontes fora da whitelist.")
            )),
            Map.entry("fechamentocaixa", new LayoutMetadata(
                    "Fechamento de Caixa",
                    List.of("empresa", "caixa", "dataEmissao", "operadorNome", "totalEntradas", "totalSaidas", "saldoFinalCalculado", "valorInformado", "diferenca"),
                    List.of("Layout normalmente usado em impressora térmica.", "Prefira fontes monospace ou sans-serif homologadas.")
            )),
            Map.entry("espelhonota", new LayoutMetadata(
                    "Espelho de Nota",
                    List.of("empresa", "nota", "itens", "dataEmissao"),
                    List.of("Documento de conferência operacional.", "Mantenha tabela de itens como elemento central.")
            )),
            Map.entry("dre", new LayoutMetadata(
                    "DRE",
                    List.of("empresa", "dados", "mesExtenso", "receitaLiquida", "lucroBruto", "totalDespesas", "lucroLiquido", "margemLiquida", "dataEmissao"),
                    List.of("Relatório A4; evite largura excessiva.", "Priorize leitura executiva e contraste.")
            )),
            Map.entry("relatoriocomissao", new LayoutMetadata(
                    "Relatório de Comissão",
                    List.of("empresa", "dados", "dataInicio", "dataFim", "dataEmissao"),
                    List.of("O dado principal é uma lista de membros com detalhes.", "Estruture cabeçalho e blocos repetidos com clareza.")
            )),
            Map.entry("relatoriocontaspagar", new LayoutMetadata(
                    "Relatório de Contas a Pagar",
                    List.of("empresa", "contas", "totalGeral", "dataEmissao", "tituloRelatorio"),
                    List.of("Relatório tabular A4.", "Evite dependência de CSS avançado de browser.")
            )),
            Map.entry("relatoriocontasreceber", new LayoutMetadata(
                    "Relatório de Contas a Receber",
                    List.of("empresa", "contas", "totalGeral", "dataEmissao", "tituloRelatorio"),
                    List.of("Relatório tabular A4.", "Evite dependência de CSS avançado de browser.")
            ))
    );

    public LayoutMetadata getMetadata(String tipoLayout) {
        LayoutMetadata metadata = METADATA_BY_TYPE.get(normalizeType(tipoLayout));
        if (metadata == null) {
            throw new IllegalArgumentException("Tipo de layout não encontrado: " + tipoLayout);
        }
        return metadata;
    }

    public LayoutValidationResult validate(String tipoLayout, String html) {
        LayoutMetadata metadata = getMetadata(tipoLayout);
        List<String> errors = new java.util.ArrayList<>();
        List<String> warnings = new java.util.ArrayList<>();

        if (html == null || html.trim().isEmpty()) {
            errors.add("HTML não pode estar vazio.");
        } else {
            if (html.length() > MAX_TEMPLATE_SIZE) {
                errors.add("HTML excede o limite de tamanho suportado para templates.");
            }
            if (!html.toLowerCase().contains("<html")) {
                errors.add("Template deve conter a tag <html>.");
            }
            if (SCRIPT_PATTERN.matcher(html).find()) {
                errors.add("Scripts não são permitidos em layouts de impressão.");
            }
            if (IFRAME_PATTERN.matcher(html).find()) {
                errors.add("Iframes não são permitidos em layouts de impressão.");
            }
            if (EVENT_HANDLER_PATTERN.matcher(html).find()) {
                errors.add("Eventos inline como onclick/onload não são permitidos.");
            }
            if (REMOTE_ASSET_PATTERN.matcher(html).find()) {
                warnings.add("Assets remotos via http/https podem falhar no renderer de PDF.");
            }
            if (STSONG_PATTERN.matcher(html).find()) {
                warnings.add("Fonte incompatível detectada. Prefira Helvetica, Arial, Times ou Courier.");
            }
            if (FONT_FACE_PATTERN.matcher(html).find()) {
                warnings.add("Uso de @font-face exige homologação prévia no renderer.");
            }
        }

        return new LayoutValidationResult(errors.isEmpty(), errors, warnings, metadata.availableVariables(), metadata.notes());
    }

    private String normalizeType(String tipoLayout) {
        return tipoLayout == null ? "" : tipoLayout.trim().toLowerCase();
    }

    public record LayoutMetadata(
            String displayName,
            List<String> availableVariables,
            List<String> notes
    ) {
    }

    public record LayoutValidationResult(
            boolean valid,
            List<String> errors,
            List<String> warnings,
            List<String> availableVariables,
            List<String> notes
    ) {
    }
}
