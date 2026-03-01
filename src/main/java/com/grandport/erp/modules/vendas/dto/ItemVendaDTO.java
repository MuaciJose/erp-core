package com.grandport.erp.modules.vendas.dto;

import java.math.BigDecimal;

public record ItemVendaDTO(
    Long produtoId,
    Integer quantidade,
    BigDecimal precoUnitario
) {}
