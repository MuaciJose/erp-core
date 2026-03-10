package com.grandport.erp.modules.compras.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "compras_xml_itens")
@Data
public class CompraItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long produtoId;
    private String nome;
    private BigDecimal precoCusto;
    private BigDecimal precoVenda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id")
    private CompraXML compra;
}