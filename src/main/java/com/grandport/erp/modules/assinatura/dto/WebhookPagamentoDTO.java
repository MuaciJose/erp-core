package com.grandport.erp.modules.assinatura.dto;

public record WebhookPagamentoDTO(
        String provider,
        String eventType,
        String externalEventId,
        Long empresaId,
        String gatewayCobrancaId,
        String status,
        String paidAt,
        String payloadJson
) {}
