package com.grandport.erp.modules.assinatura.dto;

public record PlataformaAvisoOperacionalDTO(
        Boolean ativo,
        String severidade,
        Boolean bloquearAcesso,
        String titulo,
        String mensagem,
        String inicioPrevisto,
        String fimPrevisto,
        String updatedAt,
        String updatedBy
) {}
