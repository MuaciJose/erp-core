package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@MappedSuperclass
@Data
@EqualsAndHashCode(callSuper = true)
public abstract class Conta  extends BaseEntityMultiEmpresa {

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
