package com.grandport.erp.modules.vendas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
public class PagamentoVenda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String metodo; // PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO
    private BigDecimal valor;
    private Integer parcelas = 1; // Para cartão
}
