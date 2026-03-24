package com.grandport.erp.modules.compras.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "compras_importadas")
@Data
@EqualsAndHashCode(callSuper = true)
public class Compra extends BaseEntityMultiEmpresa {

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