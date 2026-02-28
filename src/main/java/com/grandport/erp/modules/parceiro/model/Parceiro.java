package com.grandport.erp.modules.parceiro.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "parceiros")
@Data
public class Parceiro {
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

    @Transient // Não persiste no banco, é calculado
    public BigDecimal getSaldoDisponivel() {
        return limiteCredito.subtract(saldoDevedor);
    }
}
