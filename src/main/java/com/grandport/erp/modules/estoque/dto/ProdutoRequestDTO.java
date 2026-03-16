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
        String referenciaOriginal,

        // 🚀 CAMPOS QUE ESTAVAM FALTANDO PARA A FERRARI FUNCIONAR
        Long categoriaId,
        Boolean ativo,
        BigDecimal margemLucro,
        BigDecimal precoMinimo,
        BigDecimal comissao,
        String unidadeMedida,
        Integer estoqueMaximo,
        String localizacao,
        BigDecimal pesoLiquido,
        BigDecimal pesoBruto,
        Boolean permitirEstoqueNegativo,

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