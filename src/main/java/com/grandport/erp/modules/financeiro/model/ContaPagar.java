package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "contas_pagar")
@Data
@EqualsAndHashCode(callSuper = true)
public class ContaPagar extends Conta {

    private String descricao;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Parceiro fornecedor;
}
