package com.grandport.erp.modules.servicos.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "servicos_catalogo")
@Data
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String codigo; // Ex: ALINHAMENTO-01

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal preco = BigDecimal.ZERO;

    private Integer tempoEstimadoMinutos; // Para medir a produtividade do mecânico

    private Boolean ativo = true;
}