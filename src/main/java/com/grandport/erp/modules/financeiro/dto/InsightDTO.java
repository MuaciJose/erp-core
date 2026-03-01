package com.grandport.erp.modules.financeiro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsightDTO {
    private String tipo;
    private String titulo;
    private String mensagem;
    private String acaoSugestao;
    private String cor;
}
