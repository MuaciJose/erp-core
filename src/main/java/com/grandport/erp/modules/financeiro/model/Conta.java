package com.grandport.erp.modules.financeiro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@MappedSuperclass
@Data
public abstract class Conta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal valorOriginal;
    private BigDecimal valorPago;
    private LocalDateTime dataVencimento;
    private LocalDateTime dataPagamento;

    @Enumerated(EnumType.STRING)
    private StatusFinanceiro status = StatusFinanceiro.PENDENTE;
}
