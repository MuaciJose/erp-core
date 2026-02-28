package com.grandport.erp.modules.estoque.model;

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

    @Column(unique = true, nullable = false)
    private String sku; // Código Interno (Ex: GP-2024-AMORT)

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;
    
    @Column(columnDefinition = "TEXT")
    private String aplicacao; // Compatibilidade (Ex: Uno, Palio, Strada)

    private String codigoBarras; // EAN para Leitor Mobile

    @Column(length = 20)
    private String localizacao; // Exemplo: CORREDOR A - PRATEL. 04

    @Column(precision = 10, scale = 2)
    private BigDecimal precoCusto;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoVenda;

    private Integer quantidadeEstoque;
    
    private Integer estoqueMinimo;

    private String fotoUrl; // Para links externos (ex: fotos do fabricante)
    
    private String fotoLocalPath; // Para o caminho do arquivo após o upload

    // RELACIONAMENTOS ESTILO ERP SAP/TOTVS
    
    @ManyToOne
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca; // Relaciona com a classe que você acabou de criar

    @ManyToOne
    @JoinColumn(name = "ncm_codigo", nullable = false)
    private Ncm ncm; // Relaciona com o código importado do seu JSON
}
