package com.grandport.erp.modules.financeiro.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LancamentoDTO(
    String descricao,
    BigDecimal valor,
    LocalDateTime dataVencimento,
    Long parceiroId, // ID do Cliente ou Fornecedor
    String tipo // "PAGAR" ou "RECEBER"
) {}
