package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.vendas.model.Venda;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contas_receber")
@Data
public class ContaReceber {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String clienteNome; // Pode ser FK para Clientes depois
    private BigDecimal valorOriginal;
    private BigDecimal valorPago;
    private LocalDateTime dataVencimento;
    private LocalDateTime dataPagamento;
    
    @Enumerated(EnumType.STRING)
    private StatusFinanceiro status = StatusFinanceiro.PENDENTE;

    @ManyToOne
    @JoinColumn(name = "venda_id")
    private Venda venda; // Link para a venda de autopeças
}
