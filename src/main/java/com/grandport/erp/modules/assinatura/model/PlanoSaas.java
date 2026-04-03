package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "planos_saas")
@Data
public class PlanoSaas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(name = "nome_exibicao", nullable = false)
    private String nomeExibicao;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "valor_mensal_base", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorMensalBase = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
