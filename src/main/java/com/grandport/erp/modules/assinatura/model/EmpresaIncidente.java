package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresa_incidentes")
@Data
public class EmpresaIncidente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(nullable = false, length = 180)
    private String titulo;

    @Column(nullable = false, length = 40)
    private String severidade;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(length = 120)
    private String responsavel;

    @Column(name = "prazo_resposta")
    private LocalDate prazoResposta;

    @Column(name = "prazo_resolucao")
    private LocalDate prazoResolucao;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String resolucao;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 120)
    private String createdBy;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;
}
