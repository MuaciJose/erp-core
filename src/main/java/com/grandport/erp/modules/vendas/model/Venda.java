package com.grandport.erp.modules.vendas.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendas")
@Data
public class Venda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDateTime dataHora = LocalDateTime.now();
    
    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemVenda> itens = new ArrayList<>();
    
    private BigDecimal desconto = BigDecimal.ZERO;
    private BigDecimal valorSubtotal; // Soma dos produtos sem desconto
    private BigDecimal valorTotal;    // Subtotal - Desconto

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "venda_id") // Garante a chave estrangeira na tabela de pagamentos
    private List<PagamentoVenda> pagamentos = new ArrayList<>();
}
