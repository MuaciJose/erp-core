package com.grandport.erp.modules.os.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grandport.erp.modules.servicos.model.Servico;
import com.grandport.erp.modules.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "os_itens_servicos")
@Data
public class OsItemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_servico_id")
    @JsonIgnore
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @ManyToOne
    @JoinColumn(name = "mecanico_id")
    private Usuario mecanico; // Opcional no orçamento, obrigatório na execução

    private Integer quantidade = 1;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoUnitario = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal comissao = BigDecimal.ZERO;

    private Boolean ativo = true;
}