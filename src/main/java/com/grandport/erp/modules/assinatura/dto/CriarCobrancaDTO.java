package com.grandport.erp.modules.assinatura.dto;

public record CriarCobrancaDTO(
        String referencia,
        Double valor,
        String dataVencimento,
        String gatewayNome,
        String gatewayCobrancaId,
        String paymentLink,
        String descricao,
        String observacoes
) {}
