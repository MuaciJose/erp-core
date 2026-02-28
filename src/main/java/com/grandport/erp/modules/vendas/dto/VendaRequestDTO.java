package com.grandport.erp.modules.vendas.dto;

import java.math.BigDecimal;
import java.util.List;

public record VendaRequestDTO(
    List<ItemVendaDTO> itens,
    List<PagamentoVendaDTO> pagamentos,
    BigDecimal desconto
) {}
