package com.grandport.erp.modules.estoque.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "categorias")
@Data
@EqualsAndHashCode(callSuper = true)
public class Categoria extends BaseEntityMultiEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nome;

    private Boolean ativo = true;
}