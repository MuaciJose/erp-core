package com.grandport.erp.modules.estoque.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "ncms")
@Data
@EqualsAndHashCode(callSuper = true)
public class Ncm extends BaseEntityMultiEmpresa {

    @Id
    @Column(name = "codigo", length = 20)
    @JsonProperty("Codigo") // Lê "Codigo" do JSON e salva em "codigo" no banco
    private String codigo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    @JsonProperty("Descricao")
    private String descricao;

    @Column(name = "data_inicio")
    @JsonProperty("Data_Inicio")
    private String dataInicio;

    @Column(name = "data_fim")
    @JsonProperty("Data_Fim")
    private String dataFim;

    @Column(name = "numero_ato")
    @JsonProperty("Numero_Ato_Ini")
    private String numeroAto;
}