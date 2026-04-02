package com.grandport.erp.modules.atendimento.dto;

public record AtualizarAtendimentoStatusDTO(
        String status,
        String plataformaResponsavel,
        Long incidenteId
) {}
