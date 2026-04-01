package com.grandport.erp.modules.assinatura.dto;

public record SolicitacaoAcessoResumoDTO(
        Long id,
        String razaoSocial,
        String cnpj,
        String telefone,
        String nomeContato,
        String emailContato,
        String observacoes,
        String status,
        String createdAt
) {}
