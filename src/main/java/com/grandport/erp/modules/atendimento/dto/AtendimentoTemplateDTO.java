package com.grandport.erp.modules.atendimento.dto;

public record AtendimentoTemplateDTO(
        Long id,
        String titulo,
        String conteudo,
        String createdAt,
        String updatedAt,
        String createdBy
) {}
