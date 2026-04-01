package com.grandport.erp.modules.assinatura.dto;

public record AtualizarPlanoEmpresaDTO(
        String plano,
        Double valorMensal,
        Integer diasTolerancia
) {}
