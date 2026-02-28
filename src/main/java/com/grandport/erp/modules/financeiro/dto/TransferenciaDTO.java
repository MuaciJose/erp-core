package com.grandport.erp.modules.financeiro.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferenciaDTO {
    private Long contaOrigemId;
    private Long contaDestinoId;
    private BigDecimal valor;
}
