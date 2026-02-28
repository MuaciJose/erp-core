package com.grandport.erp.modules.financeiro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "caixa_diario")
@Data
public class CaixaDiario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dataAbertura;
    private LocalDateTime dataFechamento;

    @Column(precision = 10, scale = 2)
    private BigDecimal saldoInicial = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalDinheiro = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalCartao = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalPix = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalSangrias = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorInformadoFechamento;

    @Enumerated(EnumType.STRING)
    private StatusCaixa status;
}
