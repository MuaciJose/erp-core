package com.grandport.erp.modules.parceiro.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BrasilApiCepDTO {
    private String cep;
    private String state;
    private String city;
    private String neighborhood;
    private String street;
    private String ibge; // Campo que faltava
}
