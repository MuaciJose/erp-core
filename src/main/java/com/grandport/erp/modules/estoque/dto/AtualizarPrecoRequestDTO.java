package com.grandport.erp.modules.estoque.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AtualizarPrecoRequestDTO {
    private Long id;
    private BigDecimal novoPrecoVenda;
}
