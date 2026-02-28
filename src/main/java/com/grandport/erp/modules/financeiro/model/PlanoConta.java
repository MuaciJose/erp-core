package com.grandport.erp.modules.financeiro.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "plano_contas")
@Data
public class PlanoConta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String codigo; // Ex: "1.1", "2.2.1"
    private String descricao;
    private String tipo; // RECEITA ou DESPESA
    
    private Boolean aceitaLancamento = true;

    @ManyToOne
    @JoinColumn(name = "conta_pai_id")
    private PlanoConta contaPai;

    @OneToMany(mappedBy = "contaPai", cascade = CascadeType.ALL)
    private List<PlanoConta> filhas;
}
