package com.grandport.erp.modules.vendas.model;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.veiculo.model.Veiculo;
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
    
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Parceiro cliente;

    @ManyToOne
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    private Integer kmVeiculo;

    private String vendedorNome;

    @Enumerated(EnumType.STRING)
    private StatusVenda status = StatusVenda.CONCLUIDA; // Padrão para vendas diretas no PDV

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemVenda> itens = new ArrayList<>();
    
    private BigDecimal desconto = BigDecimal.ZERO;
    private BigDecimal valorSubtotal;
    private BigDecimal valorTotal;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "venda_id")
    private List<PagamentoVenda> pagamentos = new ArrayList<>();
}
