package com.grandport.erp.modules.assinatura.dto;

public record AtualizarCadastroComplementarDTO(
        String nomeFantasia,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        String regimeTributario,
        String website,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        String responsavelFinanceiroNome,
        String responsavelFinanceiroEmail,
        String responsavelFinanceiroTelefone,
        String responsavelOperacionalNome,
        String responsavelOperacionalEmail,
        String responsavelOperacionalTelefone,
        Boolean aceiteLgpd,
        String observacoes
) {}
