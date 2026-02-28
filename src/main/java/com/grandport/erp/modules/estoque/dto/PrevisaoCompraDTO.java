package com.grandport.erp.modules.estoque.dto;

import lombok.Data;

@Data
public class PrevisaoCompraDTO {
    private Long produtoId;
    private String nome;
    private Integer estoqueAtual;
    private Double mediaVendaDiaria;
    private Integer diasRestantes;
    private Integer sugestaoCompra;

    public PrevisaoCompraDTO(Long produtoId, String nome, Integer estoqueAtual, Double mediaVendaDiaria) {
        this.produtoId = produtoId;
        this.nome = nome;
        this.estoqueAtual = estoqueAtual;
        this.mediaVendaDiaria = mediaVendaDiaria;

        if (mediaVendaDiaria > 0) {
            this.diasRestantes = (int) (estoqueAtual / mediaVendaDiaria);
            // Sugestão para cobrir os próximos 30 dias
            this.sugestaoCompra = Math.max(0, (int) (30 * mediaVendaDiaria) - estoqueAtual);
        } else {
            this.diasRestantes = 999; // Representa "infinito"
            this.sugestaoCompra = 0;
        }
    }
}
