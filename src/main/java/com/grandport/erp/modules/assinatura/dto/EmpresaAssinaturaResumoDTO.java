package com.grandport.erp.modules.assinatura.dto;

public record EmpresaAssinaturaResumoDTO(
        Long id,
        String razaoSocial,
        String cnpj,
        String emailContato,
        String telefone,
        Boolean ativo,
        String statusAssinatura,
        String dataVencimento,
        String motivoBloqueio,
        String adminPrincipal,
        String plano,
        Double valorMensal,
        Integer diasTolerancia,
        Integer totalModulosAtivos,
        Integer totalModulosExtras,
        Integer totalModulosBloqueados,
        Integer totalModulosBloqueadosComercialmente,
        Double valorExtrasMensal,
        Double valorTotalMensalPrevisto,
        java.util.List<String> extrasCobrados,
        String ultimaCobrancaStatus,
        String ultimaCobrancaVencimento,
        Double ultimaCobrancaValor,
        String ultimoLinkCobranca
) {}
