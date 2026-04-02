package com.grandport.erp.modules.admin.dto;

import java.time.LocalDateTime;

public record LogAuditoriaResumoDTO(
        Long id,
        LocalDateTime dataHora,
        String usuarioNome,
        String modulo,
        String acao,
        String detalhes,
        String ipOrigem,
        Long empresaId,
        String empresaRazaoSocial
) {}
