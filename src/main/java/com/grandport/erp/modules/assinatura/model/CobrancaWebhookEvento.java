package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "cobranca_webhook_eventos")
@Data
public class CobrancaWebhookEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id")
    private Long empresaId;

    @Column(name = "cobranca_id")
    private Long cobrancaId;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(name = "external_event_id", length = 120)
    private String externalEventId;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(nullable = false)
    private Boolean processed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
