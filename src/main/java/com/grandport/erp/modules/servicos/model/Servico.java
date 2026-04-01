package com.grandport.erp.modules.servicos.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(
        name = "servicos_catalogo",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_servicos_empresa_codigo", columnNames = {"empresa_id", "codigo"})
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
public class Servico extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String codigo; // Ex: ALINHAMENTO-01

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal preco = BigDecimal.ZERO;

    private Integer tempoEstimadoMinutos; // Para medir a produtividade do mecânico

    private Boolean ativo = true;
}
