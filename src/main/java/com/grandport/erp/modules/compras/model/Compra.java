package com.grandport.erp.modules.compras.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "compras_importadas")
@Data
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroNota;
    private String fornecedorNome;
    private String fornecedorDocumento;
    private LocalDateTime dataImportacao;
    private BigDecimal valorTotal;
    private String status; // "PROCESSADO", "REVISADO", etc.
}