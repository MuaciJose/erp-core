package com.grandport.erp.modules.relatorios.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurvaAbcDTO {
    private Long id;
    private String sku;
    private String nome;
    private String referenciaOriginal; // 🚀 NOVO CAMPO ADICIONADO
    private Long qtdVendida;
    private BigDecimal valorTotal;
    private Double percAcumulado;
    private String classe;
}