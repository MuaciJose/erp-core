package com.grandport.erp.modules.vendas.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendas")
@Data
@EqualsAndHashCode(callSuper = true)
public class Venda extends BaseEntityMultiEmpresa {
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

    // Vendedor
    private Long vendedorId;
    private String vendedorNome;
    private BigDecimal valorComissao = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private StatusVenda status = StatusVenda.CONCLUIDA;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ItemVenda> itens = new ArrayList<>();

    private BigDecimal desconto = BigDecimal.ZERO;
    private BigDecimal valorSubtotal;
    private BigDecimal valorTotal;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "venda_id")
    private List<PagamentoVenda> pagamentos = new ArrayList<>();

    // 🚀 ================= FISCAL =================
    // Mapeia que esta venda pode ter uma Nota Fiscal vinculada
    @OneToOne(mappedBy = "venda", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private com.grandport.erp.modules.fiscal.model.NotaFiscal notaFiscal;
}