package com.grandport.erp.modules.agenda.dto;

public record AgendaResumoDTO(
        long total,
        long hoje,
        long atrasados,
        long concluidos,
        long altaPrioridade
) {
}
