package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.vendas.model.Venda;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "contas_receber")
@Data
@EqualsAndHashCode(callSuper = true)
public class ContaReceber extends Conta {
    
    private String clienteNome; // Pode ser FK para Clientes depois

    @ManyToOne
    @JoinColumn(name = "venda_id")
    private Venda venda; // Link para a venda de autopeças
}
