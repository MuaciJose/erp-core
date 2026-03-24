package com.grandport.erp.modules.assinatura.dto;

public record NovaEmpresaDTO(
        String razaoSocial,
        String cnpj,
        String telefone,
        String nomeAdmin,
        String emailAdmin,
        String senhaAdmin
) {}