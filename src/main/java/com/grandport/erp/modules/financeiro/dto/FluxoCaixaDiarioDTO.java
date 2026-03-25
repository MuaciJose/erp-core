package com.grandport.erp.modules.financeiro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FluxoCaixaDiarioDTO(
        LocalDate data,
        BigDecimal entradas,
        BigDecimal saidas,
        BigDecimal saldoDoDia,
        BigDecimal saldoAcumulado
) {}