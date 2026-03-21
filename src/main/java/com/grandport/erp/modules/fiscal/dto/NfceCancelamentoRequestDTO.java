package com.grandport.erp.modules.fiscal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para validação de requisição de cancelamento de NFC-e
 * 
 * Validações automáticas (usando Jakarta Validation):
 * - justificativa: não pode ser vazia e deve ter 15-255 caracteres
 */
@Data
public class NfceCancelamentoRequestDTO {

    @NotBlank(message = "Justificativa é obrigatória")
    @Size(min = 15, max = 255, 
          message = "Justificativa deve ter entre 15 e 255 caracteres")
    private String justificativa;

    /**
     * Construtor com parâmetro
     */
    public NfceCancelamentoRequestDTO(String justificativa) {
        this.justificativa = justificativa;
    }
}


