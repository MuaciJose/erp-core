package com.grandport.erp.modules.os.model;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordens_servico")
@Data
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Parceiro cliente;

    @ManyToOne
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @ManyToOne
    @JoinColumn(name = "consultor_id")
    private Usuario consultor; // Quem atendeu no balcão

    @Enumerated(EnumType.STRING)
    private StatusOS status = StatusOS.ORCAMENTO;

    // --- CHECK-IN DO VEÍCULO ---
    private Integer kmEntrada;
    private String nivelCombustivel; // Ex: 1/4, Meio Tanque, Cheio

    @Column(columnDefinition = "TEXT")
    private String defeitoRelatado; // O que o cliente disse

    @Column(columnDefinition = "TEXT")
    private String diagnosticoTecnico; // O que o mecânico achou

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // --- DATAS ---
    private LocalDateTime dataEntrada = LocalDateTime.now();
    private LocalDateTime dataSaida;

    // --- FINANCEIRO DA OS ---
    @Column(precision = 10, scale = 2)
    private BigDecimal totalPecas = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalServicos = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    // --- ITENS (PEÇAS E MÃO DE OBRA) ---
    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OsItemPeca> itensPecas = new ArrayList<>();

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OsItemServico> itensServicos = new ArrayList<>();
}