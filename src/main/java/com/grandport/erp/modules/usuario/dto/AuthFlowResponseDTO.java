package com.grandport.erp.modules.usuario.dto;

public record AuthFlowResponseDTO(
        String token,
        UsuarioDTO usuario,
        boolean mfaRequired,
        boolean mfaSetupRequired,
        String challengeToken,
        String setupSecret,
        String otpauthUri,
        String message
) {}
