package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.DecimalMin;
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

    @NotBlank(message = "Nome da conta é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String nome; // Ex: Caixa Econômica - Conta Principal

    @DecimalMin(value = "0.0", message = "Saldo não pode ser negativo")
    @Column(precision = 15, scale = 2)
    private BigDecimal saldoAtual = BigDecimal.ZERO;

    @NotBlank(message = "Tipo de conta é obrigatório")
    private String tipo; // CAIXA_FISICO, BANCO, CARTEIRA_DIGITAL

    // =========================================================================
    // 🏦 DADOS BÁSICOS DO BANCO
    // =========================================================================
    @NotBlank(message = "Número do banco é obrigatório")
    @Pattern(regexp = "\\d{3}", message = "Número do banco deve ter exatamente 3 dígitos")
    private String numeroBanco; // Ex: 341 (Itaú), 001 (BB), 104 (Caixa)
    
    @NotBlank(message = "Agência é obrigatória")
    @Size(min = 4, max = 10, message = "Agência deve ter entre 4 e 10 caracteres")
    private String agencia;
    
    @Size(max = 2, message = "Dígito da agência não pode ter mais de 2 caracteres")
    private String digitoAgencia; // Alguns bancos exigem, outros não
    
    @NotBlank(message = "Número da conta é obrigatório")
    @Size(min = 5, max = 15, message = "Número da conta deve ter entre 5 e 15 caracteres")
    private String numeroConta;
    
    @Size(max = 2, message = "Dígito da conta não pode ter mais de 2 caracteres")
    private String digitoConta;

    @Size(max = 20, message = "Convênio não pode ter mais de 20 caracteres")
    private String convenio; // Essencial para Banco do Brasil e Caixa
    
    // =========================================================================
    // 📄 DADOS PARA EDI BANCÁRIO (BOLETOS / CNAB)
    // =========================================================================

    // Código de Cedente / Beneficiário (O código que o banco te dá para emitir boletos)
    @Size(max = 20, message = "Código cedente não pode ter mais de 20 caracteres")
    private String codigoCedente;

    // Carteira de Cobrança (Ex: 109 para Itaú sem registro, 17 para BB com registro)
    @Size(max = 5, message = "Carteira não pode ter mais de 5 caracteres")
    private String carteira;

    // Variacao da Carteira (Muito usado no Banco do Brasil, ex: 019)
    @Size(max = 10, message = "Variação da carteira não pode ter mais de 10 caracteres")
    private String variacaoCarteira;

    //Controla qual foi o último boleto gerado para não repetir
    // Cada vez que gerar um boleto, o Java faz: nossoNumeroAtual + 1
    @Column(nullable = false)
    private Long nossoNumeroAtual = 0L;

    @Column(length = 3)
    private String tipoCnab = "400"; // Padrão 400 ou 240

    // =========================================================================
    // 🗑️ SOFT DELETE (Auditoria e rastreamento)
    // =========================================================================
    
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true; // true = ativa, false = deletada (soft delete)

    @Column(name = "data_delecao")
    private java.time.LocalDateTime dataDelecao; // Data quando foi deletada

    @Column(name = "usuario_delecao", length = 255)
    private String usuarioDelecao; // Quem deletou

}