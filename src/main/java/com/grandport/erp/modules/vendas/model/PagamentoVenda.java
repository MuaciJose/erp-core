package com.grandport.erp.modules.vendas.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class PagamentoVenda extends BaseEntityMultiEmpresa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String metodo; // PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO
    private BigDecimal valor;
    private Integer parcelas = 1; // Para cartão
}
