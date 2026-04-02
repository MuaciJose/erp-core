package com.grandport.erp.modules.assinatura.dto;

import java.util.List;

public record EmpresaCobrancaComposicaoDTO(
        Double valorPlanoBase,
        Double valorExtras,
        Double valorTotalPrevisto,
        List<String> extrasCobrados
) {}
