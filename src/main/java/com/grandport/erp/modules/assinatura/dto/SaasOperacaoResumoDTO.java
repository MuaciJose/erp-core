package com.grandport.erp.modules.assinatura.dto;

public record SaasOperacaoResumoDTO(
        Integer totalEmpresas,
        Integer empresasAtivas,
        Integer empresasInadimplentes,
        Integer empresasBloqueadas,
        Integer empresasVencendo7Dias,
        Double mrrBase,
        Double mrrExtras,
        Integer modulosExtrasAtivos,
        Integer trialsAtivos,
        Integer empresasComBloqueioComercial,
        Integer modulosBloqueadosComercialmente
) {}
