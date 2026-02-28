package com.grandport.erp.modules.parceiro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BrasilApiCnpjDTO {
    @JsonProperty("razao_social")
    private String razaoSocial;

    @JsonProperty("cep")
    private String cep;

    @JsonProperty("uf")
    private String uf;

    @JsonProperty("municipio")
    private String municipio;

    @JsonProperty("bairro")
    private String bairro;

    @JsonProperty("logradouro")
    private String logradouro;

    @JsonProperty("numero")
    private String numero;

    @JsonProperty("ddd_telefone_1")
    private String telefone;

    @JsonProperty("codigo_ibge_municipio")
    private String ibge;
}
