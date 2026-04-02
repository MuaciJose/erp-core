package com.grandport.erp.modules.assinatura.dto;

public record EmpresaTimelineEventoDTO(
        String dataHora,
        String tipo,
        String titulo,
        String descricao,
        String severidade,
        String origem
) {}
