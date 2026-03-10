package com.grandport.erp.modules.compras.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "compras_xml")
@Data
public class CompraXML {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;
    private String fornecedor;
    private String cnpjFornecedor;
    private LocalDateTime dataImportacao;
    private BigDecimal valorTotal;
    private String status; // "Pendente Revisão" ou "Finalizado"

    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CompraItem> itens = new ArrayList<>();
}