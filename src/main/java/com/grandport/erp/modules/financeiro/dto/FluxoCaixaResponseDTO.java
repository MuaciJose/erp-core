package com.grandport.erp.modules.financeiro.dto;

import java.math.BigDecimal;
import java.util.List;

public record FluxoCaixaResponseDTO(
        BigDecimal saldoInicial,
        List<FluxoCaixaDiarioDTO> dias,
        BigDecimal saldoFinalProjetado
) {}