package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresa_cadastro_complementar")
@Data
public class EmpresaCadastroComplementar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false, unique = true)
    private Long empresaId;

    @Column(name = "status_onboarding", nullable = false, length = 40)
    private String statusOnboarding = "PENDENTE_COMPLEMENTO";

    @Column(name = "prazo_conclusao")
    private LocalDate prazoConclusao;

    @Column(name = "concluido_em")
    private LocalDateTime concluidoEm;

    @Column(name = "liberacao_manual_ativa", nullable = false)
    private boolean liberacaoManualAtiva = false;

    @Column(name = "liberacao_manual_em")
    private LocalDateTime liberacaoManualEm;

    @Column(name = "liberacao_manual_por")
    private String liberacaoManualPor;

    @Column(name = "liberacao_manual_motivo", columnDefinition = "TEXT")
    private String liberacaoManualMotivo;

    @Column(name = "nome_fantasia")
    private String nomeFantasia;

    @Column(name = "inscricao_estadual")
    private String inscricaoEstadual;

    @Column(name = "inscricao_municipal")
    private String inscricaoMunicipal;

    @Column(name = "regime_tributario")
    private String regimeTributario;

    @Column(name = "website")
    private String website;

    @Column(name = "cep")
    private String cep;

    @Column(name = "logradouro")
    private String logradouro;

    @Column(name = "numero")
    private String numero;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "uf", length = 2)
    private String uf;

    @Column(name = "responsavel_financeiro_nome")
    private String responsavelFinanceiroNome;

    @Column(name = "responsavel_financeiro_email")
    private String responsavelFinanceiroEmail;

    @Column(name = "responsavel_financeiro_telefone")
    private String responsavelFinanceiroTelefone;

    @Column(name = "responsavel_operacional_nome")
    private String responsavelOperacionalNome;

    @Column(name = "responsavel_operacional_email")
    private String responsavelOperacionalEmail;

    @Column(name = "responsavel_operacional_telefone")
    private String responsavelOperacionalTelefone;

    @Column(name = "aceite_lgpd", nullable = false)
    private boolean aceiteLgpd = false;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
