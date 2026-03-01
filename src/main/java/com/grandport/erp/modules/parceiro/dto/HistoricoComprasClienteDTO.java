package com.grandport.erp.modules.parceiro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoComprasClienteDTO {
    private Long id;
    private LocalDateTime data;
    private BigDecimal valor;
    private String status;
    private String veiculo;
    private Integer itens;
}
