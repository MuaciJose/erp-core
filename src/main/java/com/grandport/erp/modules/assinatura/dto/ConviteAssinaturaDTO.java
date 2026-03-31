package com.grandport.erp.modules.assinatura.dto;

public record ConviteAssinaturaDTO(
        Long id,
        String emailDestino,
        String token,
        String status,
        String expiresAt
) {}
