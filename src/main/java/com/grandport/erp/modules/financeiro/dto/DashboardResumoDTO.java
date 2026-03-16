package com.grandport.erp.modules.financeiro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardResumoDTO {
    private BigDecimal faturamentoMes = BigDecimal.ZERO;
    private BigDecimal receberAtrasado = BigDecimal.ZERO;
    private Long vendasHoje = 0L;
    private Long produtosBaixoEstoque = 0L;
    private List<TopProdutoDTO> topProdutos;
    private List<AlertaDTO> alertas;

    // 🚀 NOVOS CAMPOS ADICIONADOS PARA OS GRÁFICOS
    private List<VendaSemanalDTO> vendasSemanal;
    private List<CategoriaVendaDTO> vendasPorCategoria;


    private Long crmAtrasados;
    private Long crmHoje;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProdutoDTO {
        private String nome;
        private Long qtd;
        private BigDecimal valor;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertaDTO {
        private String tipo;
        private String msg;
    }

    // 🚀 NOVAS CLASSES PARA OS GRÁFICOS
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendaSemanalDTO {
        private String name;
        private BigDecimal vendas;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoriaVendaDTO {
        private String name;
        private Integer value;
    }
}