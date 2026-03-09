package com.grandport.erp.modules.financeiro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recibos_avulsos")
@Data
public class Recibo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String pagador;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(columnDefinition = "TEXT")
    private String valorExtenso;

    @Column(columnDefinition = "TEXT")
    private String referente;

    private String cidade;

    private LocalDate data; // Data que sai no papel

    private LocalDateTime dataRegistro; // Data que foi salvo no sistema

    @PrePersist
    protected void onCreate() {
        this.dataRegistro = LocalDateTime.now();
    }
}