package com.grandport.erp.modules.atendimento.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "atendimento_tickets")
@Data
public class AtendimentoTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(nullable = false, length = 180)
    private String titulo;

    @Column(nullable = false, length = 60)
    private String categoria;

    @Column(nullable = false, length = 40)
    private String prioridade;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "cliente_nome", length = 160)
    private String clienteNome;

    @Column(name = "plataforma_responsavel", length = 160)
    private String plataformaResponsavel;

    @Column(name = "incidente_id")
    private Long incidenteId;

    @Column(name = "ultima_mensagem_at")
    private LocalDateTime ultimaMensagemAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;
}
