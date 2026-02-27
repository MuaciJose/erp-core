package com.grandport.erp.modules.financeiro.dto;

import java.math.BigDecimal;

public record ResumoFinanceiroDTO(
    BigDecimal totalEntradas,
    BigDecimal totalSaidas,
    BigDecimal saldoLiquido,
    long quantidadeMovimentacoes
) {}
