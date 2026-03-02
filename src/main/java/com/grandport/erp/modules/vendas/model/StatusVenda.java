package com.grandport.erp.modules.vendas.model;

public enum StatusVenda {
    ORCAMENTO,
    PEDIDO,                 // <-- NOVO STATUS ADICIONADO!
    AGUARDANDO_PAGAMENTO,   // Fila do Caixa
    CONCLUIDA,              // Faturado
    CANCELADA
}