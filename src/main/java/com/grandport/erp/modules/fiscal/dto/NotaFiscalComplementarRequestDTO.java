package com.grandport.erp.modules.fiscal.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO: Requisição para criar Complementação Fiscal
 */
@Data
public class NotaFiscalComplementarRequestDTO {

    @NotNull(message = "ID da nota original é obrigatório")
    @Positive(message = "ID deve ser um número positivo")
    private Long notaOriginalId;

    @NotBlank(message = "Tipo de complementação é obrigatório")
    @Pattern(regexp = "DEVOLUCAO|DESCONTO|ACRESCIMO|CORRECAO",
             message = "Tipo deve ser: DEVOLUCAO, DESCONTO, ACRESCIMO ou CORRECAO")
    private String tipoComplementacao;

    @NotBlank(message = "Descrição do motivo é obrigatória")
    @Size(min = 10, max = 500,
          message = "Descrição deve ter entre 10 e 500 caracteres")
    private String descricaoMotivo;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    @Digits(integer = 10, fraction = 2,
            message = "Valor máximo: 9999999999.99")
    private BigDecimal valorComplementacao;
}

