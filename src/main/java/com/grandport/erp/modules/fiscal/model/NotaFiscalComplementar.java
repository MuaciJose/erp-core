package com.grandport.erp.modules.fiscal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * 📋 MODELO: Nota Fiscal Complementar
 * 
 * Usada para complementar informações de uma NF anterior (devolução, erro, etc)
 * Segue as regras da SEFAZ para NCe (Nota Complementar)
 */
@Entity
@Table(name = "notas_fiscais_complementares")
@Data
public class NotaFiscalComplementar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================================================
    // 🔗 REFERÊNCIA À NOTA ORIGINAL
    // =========================================================================

    @ManyToOne
    @JoinColumn(name = "nota_original_id", nullable = false)
    private NotaFiscal notaOriginal; // A nota que está sendo complementada

    @Column(name = "chave_acesso_original", length = 44)
    private String chaveAcessoOriginal; // Chave da nota original (para SEFAZ)

    // =========================================================================
    // 📊 IDENTIFICAÇÃO DA COMPLEMENTAR
    // =========================================================================

    @Column(name = "numero_complementar")
    private Long numeroComplementar; // Número sequencial

    @Column(name = "serie_complementar")
    private Integer serieComplementar; // Série (pode ser diferente)

    @Column(name = "chave_acesso", length = 44, unique = true)
    private String chaveAcesso; // 44 dígitos da SEFAZ

    @Column(name = "protocolo_complementar")
    private String protocoloComplementar; // Protocolo de autorização

    // =========================================================================
    // 📝 TIPO DE COMPLEMENTAÇÃO
    // =========================================================================

    @Column(name = "tipo_complementacao")
    private String tipoComplementacao; // DEVOLUCAO, DESCONTO, ACRESCIMO, CORRECAO

    @Column(columnDefinition = "TEXT")
    private String descricaoMotivo; // Por que está complementando?

    // =========================================================================
    // 💰 VALORES DA COMPLEMENTAÇÃO
    // =========================================================================

    private BigDecimal valorComplementacao = BigDecimal.ZERO;
    private BigDecimal impostoComplementacao = BigDecimal.ZERO;

    // =========================================================================
    // 📋 STATUS
    // =========================================================================

    private String status = "RASCUNHO"; // RASCUNHO, ENVIADA, AUTORIZADA, REJEITADA

    // =========================================================================
    // ⏰ DATAS
    // =========================================================================

    @Column(name = "data_emissao")
    private LocalDateTime dataEmissao = LocalDateTime.now();

    @Column(name = "data_autorizacao")
    private LocalDateTime dataAutorizacao;

    // =========================================================================
    // 🎯 MÉTODOS UTILITÁRIOS
    // =========================================================================

    /**
     * Verifica se a complementar está autorizada
     */
    public boolean estaAutorizada() {
        return "AUTORIZADA".equals(status);
    }

    /**
     * Verifica se é devolução
     */
    public boolean eDevolucao() {
        return "DEVOLUCAO".equals(tipoComplementacao);
    }

    /**
     * Calcula o valor total da complementação (valor + imposto)
     */
    public BigDecimal getValorTotal() {
        return valorComplementacao.add(impostoComplementacao);
    }
}

