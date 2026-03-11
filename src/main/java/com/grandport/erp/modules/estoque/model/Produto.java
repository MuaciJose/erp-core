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
    private String sku;

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String aplicacao;

    private String codigoBarras;

    @Column(name = "ref_original", length = 50)
    private String referenciaOriginal;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    private Boolean ativo = true;

    // ================= MÍDIA =================
    private String fotoUrl;
    private String fotoLocalPath;

    // ================= PRECIFICAÇÃO =================
    @Column(precision = 10, scale = 2)
    private BigDecimal precoCusto = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal margemLucro = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoVenda = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoMinimo = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal comissao = BigDecimal.ZERO;

    // ================= ESTOQUE & LOGÍSTICA =================
    private String unidadeMedida = "UN";

    @Column(name = "quantidade_estoque")
    @JsonProperty("quantidadeEstoque")
    private Integer quantidadeEstoque = 0;

    private Integer estoqueMinimo = 0;
    private Integer estoqueMaximo = 0;

    @Column(length = 50)
    private String localizacao;

    @Column(precision = 10, scale = 3)
    private BigDecimal pesoLiquido = BigDecimal.ZERO;

    @Column(precision = 10, scale = 3)
    private BigDecimal pesoBruto = BigDecimal.ZERO;

    private Boolean permitirEstoqueNegativo = false;

    // ================= RELACIONAMENTOS FISCAIS =================
    @ManyToOne
    @JoinColumn(name = "ncm_codigo", nullable = false)
    private Ncm ncm;

    // ================= DADOS FISCAIS =================
    @Column(length = 7)
    private String cest;

    private Integer origemMercadoria = 0; // 0-Nacional, 1-Estrangeira, etc.

    @Column(length = 4)
    private String cfopPadrao = "5102";

    @Column(length = 3)
    private String csosnPadrao = "102";

    @Column(length = 3)
    private String cstPadrao = "00";

    @Column(length = 3)
    private String cstIcms;

    @Column(length = 3)
    private String cstPisCofins;

    @Column(length = 3)
    private String cstIpi;

    @Column(precision = 5, scale = 2)
    private BigDecimal aliquotaIcms = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal aliquotaIpi = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal aliquotaPis = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal aliquotaCofins = BigDecimal.ZERO;

    // ================= RELACIONAMENTOS =================
    @ManyToOne
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;
}