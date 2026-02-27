package com.grandport.erp.modules.estoque.dto;

import java.math.BigDecimal;

public record ProdutoRequestDTO(
    String sku,
    String nome,
    String descricao,
    String codigoBarras,
    BigDecimal precoCusto,
    BigDecimal precoVenda,
    Integer quantidadeEstoque,
    Long marcaId,    // Apenas o ID da Marca
    String ncmCodigo, // O código do seu JSON (ex: "01.01")
    String fotoUrl
) {}
