package com.grandport.erp.modules.vendas.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendas_perdidas")
@Data
@EqualsAndHashCode(callSuper = true)
public class VendaPerdida extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricaoPeca;

    private LocalDateTime dataRegistro = LocalDateTime.now();

    private String status = "PENDENTE"; // PENDENTE, ANALISADO, COMPRADO
}
