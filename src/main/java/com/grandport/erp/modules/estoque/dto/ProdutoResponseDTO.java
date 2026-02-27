package com.grandport.erp.modules.estoque.dto;

import com.grandport.erp.modules.estoque.model.Produto;

import java.math.BigDecimal;

public record ProdutoResponseDTO(
    Long id,
    String sku,
    String nome,
    String descricao,
    BigDecimal precoVenda,
    Integer quantidadeEstoque,
    String fotoUrl,
    String fotoLocalPath
) {
    public ProdutoResponseDTO(Produto produto) {
        this(
            produto.getId(),
            produto.getSku(),
            produto.getNome(),
            produto.getDescricao(),
            produto.getPrecoVenda(),
            produto.getQuantidadeEstoque(),
            produto.getFotoUrl(),
            produto.getFotoLocalPath()
        );
    }
}
