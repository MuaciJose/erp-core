package com.grandport.erp.modules.estoque.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "movimentacoes_estoque")
@Data
@EqualsAndHashCode(callSuper = true)
public class MovimentacaoEstoque extends BaseEntityMultiEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dataMovimentacao = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    private Integer quantidade;
    private String tipo; // "ENTRADA", "SAIDA"
    private String motivo; // Ex: "Venda Balcão"

    // 🚀 NOVOS CAMPOS PARA RASTREABILIDADE
    private String parceiro; // Nome do Cliente ou Fornecedor
    private String documento; // Número da NF-e, Venda ou Pedido

    private Integer saldoAnterior;
    private Integer saldoAtual;
}