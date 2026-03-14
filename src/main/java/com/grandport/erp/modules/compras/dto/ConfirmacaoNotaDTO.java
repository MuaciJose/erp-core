package com.grandport.erp.modules.compras.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ConfirmacaoNotaDTO {
    private List<ItemConfirmacao> itens;

    @Data
    public static class ItemConfirmacao {
        private Long produtoId;
        private BigDecimal precoVenda;
    }
}