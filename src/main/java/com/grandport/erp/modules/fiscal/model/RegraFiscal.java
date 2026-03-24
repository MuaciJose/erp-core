package com.grandport.erp.modules.fiscal.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "fiscal_regras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RegraFiscal extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeRegra; // Ex: "Venda Padrão - Simples Nacional"

    private String ncmPrefixo; // Ex: "6109" ou deixe nulo para regra geral
    private String estadoDestino; // Ex: "PE" ou "TODOS"

    @Column(nullable = false)
    private String cfop; // Ex: "5102"

    @Column(nullable = false)
    private String cstIcms; // Ex: "102" ou "00"

    // Alíquotas
    @Column(precision = 5, scale = 2)
    private BigDecimal icmsAliquota = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal pisAliquota = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal cofinsAliquota = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal ipiAliquota = BigDecimal.ZERO;
}