package com.grandport.erp.modules.atendimento.dto;

public record AtendimentoResumoDTO(
        long aguardandoPlataforma,
        long ticketsCriticos,
        long slaVencido,
        long semResponsavel,
        long finalizados,
        long tempoMedioPrimeiraRespostaMinutos
) {}
