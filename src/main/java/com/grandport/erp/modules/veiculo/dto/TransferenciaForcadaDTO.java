package com.grandport.erp.modules.veiculo.dto;

import lombok.Data;

@Data
public class TransferenciaForcadaDTO {
    private Long veiculoId;
    private Long novoClienteId;
    private String senhaOperador;
}
