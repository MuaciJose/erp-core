package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "contas_pagar")
@Data
@EqualsAndHashCode(callSuper = true)
public class ContaPagar extends Conta {

    private String descricao;

    @ManyToOne
    @JoinColumn(name = "parceiro_id")
    private Parceiro parceiro;

    @ManyToOne
    @JoinColumn(name = "plano_conta_id")
    private PlanoConta planoConta;
}
