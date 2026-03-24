package com.grandport.erp.modules.os.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordens_servico")
@Data
@EqualsAndHashCode(callSuper = true)
public class OrdemServico extends BaseEntityMultiEmpresa {

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
    private Usuario consultor;

    @Enumerated(EnumType.STRING)
    private StatusOS status = StatusOS.ORCAMENTO;

    // --- DADOS DO VEÍCULO NA HORA DA MANUTENÇÃO ---
    private Integer kmEntrada; // Mantido: Essencial para Garantia da Peça e Etiqueta de Óleo

    @Column(columnDefinition = "TEXT")
    private String defeitoRelatado; // Reclamação do Cliente

    @Column(columnDefinition = "TEXT")
    private String diagnosticoTecnico; // Avaliação do Mecânico

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

    // --- ITENS ---
    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OsItemPeca> itensPecas = new ArrayList<>();

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OsItemServico> itensServicos = new ArrayList<>();

    @Column(name = "data_envio_caixa")
    private java.time.LocalDateTime dataEnvioCaixa;
}