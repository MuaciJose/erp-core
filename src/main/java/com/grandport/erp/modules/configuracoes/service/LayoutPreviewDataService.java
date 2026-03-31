package com.grandport.erp.modules.configuracoes.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class LayoutPreviewDataService {

    public Map<String, Object> buildPreviewVariables(String tipoLayout) {
        Map<String, Object> empresa = Map.of(
                "nomeFantasia", "GrandPort Premium",
                "razaoSocial", "GrandPort Premium Ltda",
                "cnpj", "12.345.678/0001-90",
                "telefone", "(81) 99999-9999",
                "cidade", "Recife",
                "uf", "PE",
                "logradouro", "Av. Exemplo",
                "numero", "1000",
                "logoBase64", ""
        );

        return switch (normalizeType(tipoLayout)) {
            case "extratocliente" -> Map.of(
                    "empresa", empresa,
                    "parceiro", Map.of("nome", "Cliente Exemplo", "documento", "123.456.789-00", "email", "cliente@exemplo.com", "telefone", "(81) 98888-1111"),
                    "contas", List.of(
                            Map.of("id", 101L, "descricao", "Parcela 1", "dataVencimento", "10/03/2026", "dataPagamento", "-", "valor", 350.0, "status", "PENDENTE", "diasAtraso", 5),
                            Map.of("id", 102L, "descricao", "Parcela 2", "dataVencimento", "20/03/2026", "dataPagamento", "21/03/2026", "valor", 280.0, "status", "RECEBIDO", "diasAtraso", 0)
                    ),
                    "totalPendente", 350.0,
                    "totalRecebido", 280.0,
                    "totalGeral", 630.0,
                    "dataInicio", "2026-03-01",
                    "dataFim", "2026-03-31",
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "extratofornecedor" -> Map.of(
                    "empresa", empresa,
                    "parceiro", Map.of("nome", "Fornecedor Exemplo", "documento", "98.765.432/0001-10", "email", "fornecedor@exemplo.com", "telefone", "(81) 97777-0000"),
                    "contas", List.of(
                            Map.of("id", 201L, "descricao", "Compra de peças", "dataVencimento", "15/03/2026", "dataPagamento", "-", "valor", 920.0, "status", "PENDENTE", "diasAtraso", 2),
                            Map.of("id", 202L, "descricao", "Serviço terceirizado", "dataVencimento", "05/03/2026", "dataPagamento", "05/03/2026", "valor", 410.0, "status", "PAGO", "diasAtraso", 0)
                    ),
                    "totalPendente", 920.0,
                    "totalPago", 410.0,
                    "totalGeral", 1330.0,
                    "dataInicio", "2026-03-01",
                    "dataFim", "2026-03-31",
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "os" -> Map.ofEntries(
                    Map.entry("empresa", empresa),
                    Map.entry("os", Map.of("id", 55L, "valorTotal", 890.0, "observacoes", "Troca de kit de embreagem", "kmEntrada", 58240)),
                    Map.entry("numeroOs", "OS-000055"),
                    Map.entry("nomeCliente", "José da Silva"),
                    Map.entry("telefoneCliente", "(81) 98888-0000"),
                    Map.entry("nomeConsultor", "Ana Consultora"),
                    Map.entry("veiculoNome", "Toyota Corolla 2.0"),
                    Map.entry("placaVeiculo", "QWE-1234"),
                    Map.entry("kmEntrada", 58240),
                    Map.entry("kmEntradaDisplay", "58240 km"),
                    Map.entry("imprimirLaudo", true)
            );
            case "venda" -> Map.ofEntries(
                    Map.entry("empresa", empresa),
                    Map.entry("venda", Map.of("id", 9001L, "valorTotal", 1250.0, "status", "ORCAMENTO", "kmVeiculo", 58310)),
                    Map.entry("isOrcamento", true),
                    Map.entry("nomeCliente", "Cliente Premium"),
                    Map.entry("nomeVendedor", "Carlos Vendedor"),
                    Map.entry("kmVeiculo", 58310),
                    Map.entry("kmVeiculoDisplay", "58310 km"),
                    Map.entry("imprimirObs", true)
            );
            case "recibo" -> Map.of(
                    "empresa", empresa,
                    "conta", Map.of("descricao", "Recebimento de serviços"),
                    "clienteNome", "Cliente Premium",
                    "valorConta", 780.0,
                    "dataEmissao", "30/03/2026 19:00",
                    "dados", Map.of(
                            "pagador", "Cliente Premium",
                            "valor", 780.0,
                            "valorExtenso", "setecentos e oitenta reais",
                            "referente", "serviços prestados",
                            "textoFinal", "quitando integralmente o débito.",
                            "cidade", "Recife",
                            "dadosCompletos", true
                    ),
                    "dataFormatada", "30 de março de 2026"
            );
            case "recibopagamento" -> Map.of(
                    "empresa", empresa,
                    "conta", Map.of("descricao", "Pagamento de fornecedor"),
                    "fornecedorNome", "Fornecedor Exemplo",
                    "valorConta", 540.0,
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "fechamentocaixa" -> Map.of(
                    "empresa", empresa,
                    "caixa", Map.of("id", 77L, "dataAbertura", "30/03/2026 08:00", "dataFechamento", "30/03/2026 18:00"),
                    "dataEmissao", "30/03/2026 19:00",
                    "operadorNome", "Operador Caixa",
                    "totalEntradas", 3400.0,
                    "totalSaidas", 220.0,
                    "saldoFinalCalculado", 1180.0,
                    "valorInformado", 1170.0,
                    "diferenca", -10.0
            );
            case "espelhonota" -> Map.of(
                    "empresa", empresa,
                    "nota", Map.of("numero", "12345", "fornecedor", "Fornecedor Exemplo", "status", "IMPORTADA", "valorTotal", 3200.0),
                    "itens", List.of(
                            Map.of("nome", "Filtro de óleo", "unidadeMedida", "UN", "quantidade", 10, "precoCusto", 22.5),
                            Map.of("nome", "Pastilha de freio", "unidadeMedida", "JG", "quantidade", 4, "precoCusto", 95.0)
                    ),
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "dre" -> Map.of(
                    "empresa", empresa,
                    "dados", Map.of("receitaBruta", 15000.0, "devolucoesDescontos", 500.0, "cmv", 4500.0, "despesasOperacionais", Map.of("salarios", 3500.0, "energia", 650.0)),
                    "mesExtenso", "Março de 2026",
                    "receitaLiquida", 14500.0,
                    "lucroBruto", 10000.0,
                    "totalDespesas", 4150.0,
                    "lucroLiquido", 5850.0,
                    "margemLiquida", 39.0,
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "relatoriocomissao" -> Map.of(
                    "empresa", empresa,
                    "dados", List.of(
                            Map.of(
                                    "nome", "Maria Vendedora",
                                    "totalComissao", 950.0,
                                    "totalBase", 9500.0,
                                    "detalhes", List.of(
                                            Map.of("origem", "VENDA", "tipoItem", "PRODUTO", "descricao", "Kit revisão", "percAplicado", 5.0, "tipoRegra", "PADRAO", "valorBase", 4500.0, "valorComissao", 225.0),
                                            Map.of("origem", "VENDA", "tipoItem", "SERVICO", "descricao", "Mão de obra", "percAplicado", 10.0, "tipoRegra", "BONUS", "valorBase", 7250.0, "valorComissao", 725.0)
                                    )
                            )
                    ),
                    "dataInicio", "01/03/2026",
                    "dataFim", "31/03/2026",
                    "dataEmissao", "30/03/2026 19:00"
            );
            case "relatoriocontaspagar" -> Map.of(
                    "empresa", empresa,
                    "contas", List.of(
                            Map.of("id", 1L, "fornecedorNome", "Fornecedor Exemplo", "descricao", "Compra de peças", "dataVencimento", "20/03/2026", "valor", 1500.0, "status", "PENDENTE")
                    ),
                    "totalGeral", 1500.0,
                    "dataEmissao", "30/03/2026 19:00",
                    "tituloRelatorio", "Relatório de Contas a Pagar (Geral)"
            );
            case "relatoriocontasreceber" -> Map.of(
                    "empresa", empresa,
                    "contas", List.of(
                            Map.of("id", 2L, "fornecedorNome", "Cliente Premium", "descricao", "Parcelamento", "dataVencimento", "22/03/2026", "valor", 980.0, "status", "RECEBIDO")
                    ),
                    "totalGeral", 980.0,
                    "dataEmissao", "30/03/2026 19:00",
                    "tituloRelatorio", "Relatório de Contas a Receber (Geral)"
            );
            default -> throw new IllegalArgumentException("Tipo de layout não encontrado: " + tipoLayout);
        };
    }

    private String normalizeType(String tipoLayout) {
        return tipoLayout == null ? "" : tipoLayout.trim().toLowerCase();
    }
}
