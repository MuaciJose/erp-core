package com.grandport.erp.modules.parceiro.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Parceiro {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeRazaoSocial;
    private String cpfCnpj;
    private String email;
    private String telefone;

    @Enumerated(EnumType.STRING)
    private TipoParceiro tipo; // CLIENTE ou FORNECEDOR

    @Embedded
    private Endereco endereco;
}
