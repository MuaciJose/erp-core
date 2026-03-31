package com.grandport.erp.modules.agenda.dto;

import java.time.LocalDateTime;

public record AgendaSugestaoDTO(
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        String label
) {
}
