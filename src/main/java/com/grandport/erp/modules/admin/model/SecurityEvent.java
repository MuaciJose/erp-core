package com.grandport.erp.modules.admin.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_events", indexes = {
        @Index(name = "idx_security_events_data", columnList = "dataHora"),
        @Index(name = "idx_security_events_tipo", columnList = "tipo"),
        @Index(name = "idx_security_events_usuario", columnList = "username"),
        @Index(name = "idx_security_events_empresa", columnList = "empresa_id")
})
@Data
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id")
    private Long empresaId;

    private LocalDateTime dataHora;

    private String tipo;

    private String severidade;

    private String username;

    private String ipOrigem;

    @Column(columnDefinition = "TEXT")
    private String detalhes;
}
