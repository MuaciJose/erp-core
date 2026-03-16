package com.grandport.erp.modules.os.dto;

import java.math.BigDecimal;

public record OsItemServicoDTO(
        Long servicoId,
        Long mecanicoId,
        Integer quantidade,
        BigDecimal precoUnitario
) {}