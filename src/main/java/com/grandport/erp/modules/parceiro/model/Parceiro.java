package com.grandport.erp.modules.parceiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "parceiros")
@Data
@EqualsAndHashCode(callSuper = true)
public class Parceiro extends BaseEntityMultiEmpresa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String documento; // CPF ou CNPJ

    private String email;
    private String telefone;

    @Enumerated(EnumType.STRING)
    private TipoParceiro tipo;

    @Embedded
    private Endereco endereco;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentualDesconto = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal limiteCredito = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal saldoDevedor = BigDecimal.ZERO;

    // 🚀 PONTE FISCAL: Resolve o erro "Cannot resolve method getUf"
    // Ele traduz o 'estado' do seu Endereco para o 'UF' que a NF-e exige.
    public String getUf() {
        return (endereco != null) ? endereco.getEstado() : null;
    }

    @Transient // Não persiste no banco, é calculado
    public BigDecimal getSaldoDisponivel() {
        return limiteCredito.subtract(saldoDevedor);
    }


    @Column(name = "intervalo_dias_pagamento")
    private Integer intervaloDiasPagamento = 30; // Padrão 30 dias
}