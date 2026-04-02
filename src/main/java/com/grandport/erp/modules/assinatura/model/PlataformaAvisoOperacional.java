package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "plataforma_avisos_operacionais")
@Data
public class PlataformaAvisoOperacional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String tipo = "MANUTENCAO";

    @Column(nullable = false, length = 20)
    private String severidade = "MANUTENCAO";

    @Column(nullable = false)
    private boolean ativo = false;

    @Column(name = "bloquear_acesso", nullable = false)
    private boolean bloquearAcesso = false;

    @Column(nullable = false, length = 160)
    private String titulo = "Manutenção programada";

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "inicio_previsto")
    private LocalDateTime inicioPrevisto;

    @Column(name = "fim_previsto")
    private LocalDateTime fimPrevisto;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updated_by")
    private String updatedBy;
}
