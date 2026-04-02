package com.grandport.erp.modules.assinatura.dto;

public record SalvarPlataformaAvisoOperacionalDTO(
        Boolean ativo,
        String severidade,
        Boolean bloquearAcesso,
        String titulo,
        String mensagem,
        String inicioPrevisto,
        String fimPrevisto
) {}
