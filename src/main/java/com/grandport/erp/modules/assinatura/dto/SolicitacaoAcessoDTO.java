package com.grandport.erp.modules.assinatura.dto;

public record SolicitacaoAcessoDTO(
        String razaoSocial,
        String cnpj,
        String telefone,
        String nomeContato,
        String emailContato,
        String observacoes
) {}
