package com.grandport.erp.modules.assinatura.dto;

public record AtualizarLicencaModuloDTO(
        String modulo,
        Boolean ativo,
        String observacao,
        Double valorMensalExtra,
        String trialAte,
        Boolean bloqueadoComercial,
        String motivoBloqueioComercial
) {}
