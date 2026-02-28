package com.grandport.erp.modules.vendas.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendas_perdidas")
@Data
public class VendaPerdida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricaoPeca;

    private LocalDateTime dataRegistro = LocalDateTime.now();

    private String status = "PENDENTE"; // PENDENTE, ANALISADO, COMPRADO
}
