package com.grandport.erp.modules.vendas.dto;

import com.grandport.erp.modules.vendas.model.StatusVenda;
import java.math.BigDecimal;
import java.util.List;

public record VendaRequestDTO(
        Long id,
        StatusVenda status,
        List<ItemVendaDTO> itens,
        List<PagamentoVendaDTO> pagamentos,
        BigDecimal desconto,
        Long parceiroId,
        Long veiculoId,
        Integer kmVeiculo  //  A PEÇA QUE FALTAVA!
) {}