package com.grandport.erp.modules.financeiro.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class DreDTO {
    private BigDecimal receitaBruta;
    private BigDecimal devolucoesDescontos;
    private BigDecimal cmv; // Custo da Mercadoria Vendida
    private Map<String, BigDecimal> despesasOperacionais;
}
