package com.grandport.erp.modules.vendas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VendaPerdidaRankingDTO {
    private String descricaoPeca;
    private Long quantidade;
}
