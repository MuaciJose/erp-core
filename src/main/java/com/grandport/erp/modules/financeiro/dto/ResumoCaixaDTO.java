package com.grandport.erp.modules.financeiro.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResumoCaixaDTO {
    private BigDecimal totalDinheiro = BigDecimal.ZERO;
    private BigDecimal totalCartao = BigDecimal.ZERO;
    private BigDecimal totalPix = BigDecimal.ZERO;
    private BigDecimal totalGeral = BigDecimal.ZERO;
    private Long quantidadeVendas = 0L;
}
