package com.grandport.erp.modules.assinatura.dto;

import java.util.List;

public record PlanoSaasDTO(
        Long id,
        String codigo,
        String nomeExibicao,
        String descricao,
        Double valorMensalBase,
        Boolean ativo,
        List<String> modulos
) {}
