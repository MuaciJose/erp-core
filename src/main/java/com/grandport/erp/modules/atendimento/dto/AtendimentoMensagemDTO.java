package com.grandport.erp.modules.atendimento.dto;

public record AtendimentoMensagemDTO(
        Long id,
        Long ticketId,
        Long empresaId,
        String autorTipo,
        String autorNome,
        String mensagem,
        String arquivoNome,
        String arquivoUrl,
        String createdAt
) {}
