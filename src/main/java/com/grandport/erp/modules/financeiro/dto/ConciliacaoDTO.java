package com.grandport.erp.modules.financeiro.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ConciliacaoDTO {
    private String contaBancaria;
    private BigDecimal saldoBanco;
    private List<TransacaoConciliacaoDTO> transacoes;

    @Data
    public static class TransacaoConciliacaoDTO {
        private String idBanco;
        private LocalDate data;
        private String descricaoBanco;
        private String tipo; // ENTRADA ou SAIDA
        private BigDecimal valor;
        private String status; // SUGERIDO, DESCONHECIDO, CONCILIADO
        private SugestaoSistemaDTO sugestaoSistema;
    }

    @Data
    public static class SugestaoSistemaDTO {
        private Long id;
        private String descricao;
        private BigDecimal valor;
    }
}
