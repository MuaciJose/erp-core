package com.grandport.erp.modules.estoque.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "produtos")
@Data
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= DADOS GERAIS E IDENTIFICAÇÃO =================
    @Column(unique = true, nullable = false)
    private String sku; // Código Interno (Ex: GP-2024-AMORT)

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String aplicacao; // Compatibilidade (Ex: Uno, Palio, Strada)

    private String codigoBarras; // EAN para Leitor Mobile

    @Column(name = "ref_original", length = 50)
    private String referenciaOriginal; // O "DNA" da peça que une as marcas

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    private Boolean ativo = true;

    // ================= MÍDIA =================
    private String fotoUrl; // Para links externos (ex: fotos do fabricante)
    private String fotoLocalPath; // Para o caminho do arquivo após o upload

    // ================= PRECIFICAÇÃO =================
    @Column(precision = 10, scale = 2)
    private BigDecimal precoCusto = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal margemLucro = BigDecimal.ZERO; // Markup em %

    @Column(precision = 10, scale = 2)
    private BigDecimal precoVenda = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoMinimo = BigDecimal.ZERO; // Alçada de desconto

    @Column(precision = 10, scale = 2)
    private BigDecimal comissao = BigDecimal.ZERO; // % de comissão pro vendedor

    // ================= ESTOQUE & LOGÍSTICA =================
    private String unidadeMedida = "UN"; // UN, PC, KG, LT

    @Column(name = "quantidade_estoque")
    @JsonProperty("quantidadeEstoque") // Garante que o JSON terá este nome exato
    private Integer quantidadeEstoque = 0;
    private Integer estoqueMinimo = 0;
    private Integer estoqueMaximo = 0;

    @Column(length = 50)
    private String localizacao; // Exemplo: CORREDOR A - PRATEL. 04

    @Column(precision = 10, scale = 3)
    private BigDecimal pesoLiquido = BigDecimal.ZERO;

    @Column(precision = 10, scale = 3)
    private BigDecimal pesoBruto = BigDecimal.ZERO;

    // A FLAG MÁGICA:
    private Boolean permitirEstoqueNegativo = false;

    // ================= FISCAL =================
    private String cest;
    private Integer origemMercadoria = 0; // 0-Nacional, 1-Estrangeira, etc.
    private String cstIcms;
    private String cstPisCofins;
    private String cstIpi;

    // ================= RELACIONAMENTOS =================
    @ManyToOne
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @ManyToOne
    @JoinColumn(name = "ncm_codigo", nullable = false)
    private Ncm ncm; // Mantido o seu relacionamento inteligente com a tabela NCM
}