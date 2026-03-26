package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "contas_bancarias")
@Data
@EqualsAndHashCode(callSuper = true)
public class ContaBancaria extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome; // Ex: Caixa Econômica - Conta Principal

    @Column(precision = 15, scale = 2)
    private BigDecimal saldoAtual = BigDecimal.ZERO;

    private String tipo; // CAIXA_FISICO, BANCO, CARTEIRA_DIGITAL

    // =========================================================================
    // 🏦 DADOS BÁSICOS DO BANCO
    // =========================================================================
    private String numeroBanco; // Ex: 341 (Itaú), 001 (BB), 104 (Caixa)
    private String agencia;
    private String digitoAgencia; // Alguns bancos exigem, outros não
    private String numeroConta;
    private String digitoConta;

    private String convenio; // Essencial para Banco do Brasil e Caixa
    // =========================================================================
    // 📄 DADOS PARA EDI BANCÁRIO (BOLETOS / CNAB)
    // =========================================================================

    // Código de Cedente / Beneficiário (O código que o banco te dá para emitir boletos)
    private String codigoCedente;

    // Carteira de Cobrança (Ex: 109 para Itaú sem registro, 17 para BB com registro)
    private String carteira;

    // Variacao da Carteira (Muito usado no Banco do Brasil, ex: 019)
    private String variacaoCarteira;

    //Controla qual foi o último boleto gerado para não repetir
    // Cada vez que gerar um boleto, o Java faz: nossoNumeroAtual + 1
    @Column(nullable = false)
    private Long nossoNumeroAtual = 0L;

    @Column(length = 3)
    private String tipoCnab = "400"; // Padrão 400 ou 240
}