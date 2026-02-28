package com.grandport.erp.modules.vendas.dto;

import java.math.BigDecimal;

public record PagamentoVendaDTO(
    String metodo,
    BigDecimal valor,
    Integer parcelas
) {}
