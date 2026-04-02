package com.grandport.erp.modules.atendimento.dto;

public record AbrirAtendimentoDTO(
        String titulo,
        String categoria,
        String prioridade,
        String mensagemInicial
) {}
