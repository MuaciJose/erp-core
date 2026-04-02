package com.grandport.erp.modules.assinatura.dto;

public record SalvarEmpresaIncidenteDTO(
        String tipo,
        String titulo,
        String severidade,
        String status,
        String responsavel,
        String prazoResposta,
        String prazoResolucao,
        String descricao,
        String resolucao
) {}
