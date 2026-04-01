package com.grandport.erp.modules.assinatura.dto;

public record ConvitePublicoDTO(
        String emailDestino,
        String expiresAt,
        String status,
        String statusMessage,
        String usedAt
) {}
