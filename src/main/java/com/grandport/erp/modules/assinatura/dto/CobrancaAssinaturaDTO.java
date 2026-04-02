package com.grandport.erp.modules.assinatura.dto;

public record CobrancaAssinaturaDTO(
        Long id,
        Long empresaId,
        String referencia,
        Double valor,
        String dataVencimento,
        String status,
        String gatewayNome,
        String gatewayCobrancaId,
        String paymentLink,
        String descricao,
        String observacoes,
        String paidAt,
        String createdAt
) {}
