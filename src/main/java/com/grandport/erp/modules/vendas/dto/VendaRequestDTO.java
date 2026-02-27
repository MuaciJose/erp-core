package com.grandport.erp.modules.vendas.dto;

import java.util.List;

public record VendaRequestDTO(
    List<ItemVendaDTO> itens
) {}
