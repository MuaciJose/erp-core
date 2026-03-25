package com.grandport.erp.modules.vendas.dto;

import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.fasterxml.jackson.annotation.JsonAlias; // 🚀 O ADAPTADOR IMPORTADO!
import java.math.BigDecimal;
import java.util.List;

public record VendaRequestDTO(
        Long id,
        StatusVenda status,
        List<ItemVendaDTO> itens,
        List<PagamentoVendaDTO> pagamentos,
        BigDecimal desconto,

        // 🚀 O FUNIL MÁGICO: Se o React mandar "clienteId" ou "parceiroId", ele aceita e funciona!
        @JsonAlias({"clienteId", "parceiroId"})
        Long parceiroId,

        Long veiculoId,
        Integer kmVeiculo,
        String observacoes
) {}