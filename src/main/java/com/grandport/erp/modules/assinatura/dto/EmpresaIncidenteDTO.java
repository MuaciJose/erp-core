package com.grandport.erp.modules.assinatura.dto;

public record EmpresaIncidenteDTO(
        Long id,
        Long empresaId,
        String tipo,
        String titulo,
        String severidade,
        String status,
        String responsavel,
        String prazoResposta,
        String prazoResolucao,
        String descricao,
        String resolucao,
        String createdAt,
        String updatedAt,
        String createdBy,
        String updatedBy
) {}
