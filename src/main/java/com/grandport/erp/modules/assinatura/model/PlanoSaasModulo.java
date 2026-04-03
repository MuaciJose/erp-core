package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "planos_saas_modulos")
@Data
public class PlanoSaasModulo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plano_id", nullable = false)
    private Long planoId;

    @Column(nullable = false)
    private String modulo;

    @Column(name = "valor_extra_padrao", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorExtraPadrao = BigDecimal.ZERO;
}
