package com.grandport.erp.modules.atendimento.dto;

public record AtendimentoTicketDTO(
        Long id,
        Long empresaId,
        String empresaNome,
        String titulo,
        String categoria,
        String prioridade,
        String status,
        String clienteNome,
        String plataformaResponsavel,
        Long incidenteId,
        String incidenteTitulo,
        String incidenteStatus,
        String incidenteSeveridade,
        String incidentePrazoResposta,
        String incidentePrazoResolucao,
        String ultimaMensagemAt,
        String createdAt,
        String updatedAt,
        String closedAt
) {}
