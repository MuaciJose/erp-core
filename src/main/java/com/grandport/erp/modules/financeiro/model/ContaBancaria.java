package com.grandport.erp.modules.financeiro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "contas_bancarias")
@Data
public class ContaBancaria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal saldoAtual = BigDecimal.ZERO;

    private String tipo; // CAIXA_FISICO, BANCO, CARTEIRA_DIGITAL

    // Novos campos para dados bancários
    private String numeroBanco;
    private String agencia;
    private String numeroConta;
}
