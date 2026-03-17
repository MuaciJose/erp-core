package com.grandport.erp.modules.os.model;

public enum StatusOS {
    ORCAMENTO,
    AGUARDANDO_APROVACAO,
    EM_EXECUCAO,
    AGUARDANDO_PECA,
    FINALIZADA, // Carro pronto, cliente pode buscar
    FATURADA,   // Passou no caixa e virou dinheiro
    CANCELADA,
    AGUARDANDO_PAGAMENTO
}