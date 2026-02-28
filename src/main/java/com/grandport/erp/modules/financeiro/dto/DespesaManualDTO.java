package com.grandport.erp.modules.financeiro.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DespesaManualDTO {
    private String descricao;
    private String fornecedor;
    private BigDecimal valor;
    private LocalDate vencimento;
    private Long planoContaId;
}
