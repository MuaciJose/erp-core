package com.grandport.erp.modules.agenda.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "agenda_compromissos")
@Data
@EqualsAndHashCode(callSuper = true)
public class CompromissoAgenda extends BaseEntityMultiEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(nullable = false, length = 30)
    private String tipo = "COMPROMISSO";

    @Column(nullable = false, length = 30)
    private String setor = "ADMINISTRATIVO";

    @Column(nullable = false, length = 30)
    private String prioridade = "NORMAL";

    @Column(nullable = false, length = 30)
    private String status = "AGENDADO";

    @Column(nullable = false)
    private LocalDateTime dataInicio;

    @Column(nullable = false)
    private LocalDateTime dataFim;

    private Long parceiroId;
    private String parceiroNome;
    private String parceiroTelefone;
    private Long veiculoId;
    private String veiculoPlaca;
    private String veiculoDescricao;
    private Long usuarioResponsavelId;
    private String usuarioResponsavelNome;

    private String origemModulo;
    private Long origemId;

    @Column(nullable = false)
    private Boolean lembreteWhatsApp = false;

    @Column(columnDefinition = "TEXT")
    private String observacaoInterna;

    private LocalDateTime concluidoEm;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = LocalDateTime.now();
        this.createdAt = agora;
        this.updatedAt = agora;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
