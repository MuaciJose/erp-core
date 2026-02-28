package com.grandport.erp.modules.estoque.dto;

import lombok.Data;

@Data
public class SugestaoCompraDTO {
    private Long produtoId;
    private String nome;
    private Integer estoqueAtual;
    private Double mediaVendaDiaria; // (Vendas 30 dias / 30)
    private Integer diasRestantes;   // (Estoque Atual / Media Diaria)
    private Integer sugestaoCompra;  // O quanto comprar para durar mais 30 dias
}
