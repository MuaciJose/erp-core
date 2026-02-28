package com.grandport.erp.modules.estoque.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "ncms")
@Data
public class Ncm {

    @Id
    @JsonProperty("Codigo")
    private String codigo;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("Descricao")
    private String descricao;

    @JsonProperty("Data_Inicio")
    private String dataInicio;

    @JsonProperty("Data_Fim")
    private String dataFim;

    @JsonProperty("Numero_Ato_Ini")
    private String numeroAto;
}
