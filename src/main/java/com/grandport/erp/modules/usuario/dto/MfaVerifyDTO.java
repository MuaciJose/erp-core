package com.grandport.erp.modules.usuario.dto;

public record MfaVerifyDTO(String challengeToken, String code) {}
