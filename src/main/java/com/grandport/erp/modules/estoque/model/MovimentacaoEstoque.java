package com.grandport.erp.modules.estoque.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacoes_estoque")
@Data
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dataMovimentacao = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    private Integer quantidade; // Positivo para entrada, negativo para saída

    private String tipo; // "ENTRADA", "SAIDA", "AJUSTE"

    private String motivo; // Ex: "Venda #123", "NF-e 456", "Inventário"
    
    private Integer saldoAnterior;
    
    private Integer saldoAtual;
}
