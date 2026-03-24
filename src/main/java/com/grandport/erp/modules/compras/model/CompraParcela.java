package com.grandport.erp.modules.compras.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "compras_parcelas")
@Data
@EqualsAndHashCode(callSuper = true)
public class CompraParcela extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero; // Ex: 001/1, 001/2
    private LocalDate vencimento;
    private BigDecimal valor;

    // Relacionamento com a Nota Pai (XML)
    @ManyToOne
    @JoinColumn(name = "compra_id")
    @JsonIgnore // Evita loop infinito quando o Java for enviar o JSON para o React
    private CompraXML compra;
}