package com.grandport.erp.modules.vendas.dto;

import java.util.List;

public record VendaDTO(
    List<ItemVendaDTO> itens
) {}
