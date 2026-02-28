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
}
