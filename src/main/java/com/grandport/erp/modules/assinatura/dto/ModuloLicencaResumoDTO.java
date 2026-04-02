package com.grandport.erp.modules.assinatura.dto;

public record ModuloLicencaResumoDTO(
        String modulo,
        String nomeExibicao,
        String categoria,
        boolean disponivelNoPlano,
        boolean ativo,
        String origem,
        String observacao,
        Double valorBaseMensal,
        Double valorMensalExtra,
        boolean trialAtivo,
        String trialAte,
        boolean bloqueadoComercial,
        String motivoBloqueioComercial,
        String atualizadoEm,
        String atualizadoPor
) {}
