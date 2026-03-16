package com.grandport.erp.modules.os.dto;

import java.math.BigDecimal;

public record OsItemPecaDTO(
        Long produtoId,
        Integer quantidade,
        BigDecimal precoUnitario
) {}