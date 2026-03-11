package com.grandport.erp.modules.estoque.dto;

import java.math.BigDecimal;

public record ProdutoRequestDTO(
        String sku,
        String nome,
        String descricao,
        String aplicacao,
        String codigoBarras,
        BigDecimal precoCusto,
        BigDecimal precoVenda,
        Integer quantidadeEstoque,
        Integer estoqueMinimo,
        Long marcaId,
        String ncmCodigo,
        String fotoUrl,

        // 🚀 NOVOS CAMPOS FISCAIS ABERTOS PARA O REACT SALVAR
        String cest,
        Integer origemMercadoria,
        String cfopPadrao,
        String csosnPadrao,
        String cstPadrao,
        String cstIcms,
        String cstPisCofins,
        String cstIpi,
        BigDecimal aliquotaIcms,
        BigDecimal aliquotaIpi,
        BigDecimal aliquotaPis,
        BigDecimal aliquotaCofins
) {}