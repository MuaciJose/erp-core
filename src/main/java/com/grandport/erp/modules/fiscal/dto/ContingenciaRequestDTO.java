package com.grandport.erp.modules.fiscal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO: Requisição para emitir em Contingência
 */
@Data
public class ContingenciaRequestDTO {

    @Positive(message = "ID da venda deve ser um número positivo")
    private Long vendaId;

    @NotBlank(message = "Justificativa é obrigatória")
    private String justificativa; // Por que está emitindo em contingência?
}

/**
 * DTO: Requisição para sincronizar Contingências
 */
@Data
class SincronizacaoContingenciaRequestDTO {
    // Pode ser expandida com filtros no futuro
    private String filtro; // todos, pendentes, etc
}

