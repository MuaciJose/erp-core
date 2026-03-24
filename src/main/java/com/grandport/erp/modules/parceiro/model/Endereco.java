package com.grandport.erp.modules.parceiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Embeddable
@Data
public class Endereco  {
    private String cep;
    private String logradouro;
    private String bairro;
    private String cidade;
    private String uf; // 🚀 Mudamos de 'estado' para 'uf' para bater com o getUf()
    private String numero;
    private String ibge;
    private String estado;
}