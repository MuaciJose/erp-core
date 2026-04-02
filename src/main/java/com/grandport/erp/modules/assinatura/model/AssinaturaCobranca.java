package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assinatura_cobrancas")
@Data
public class AssinaturaCobranca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(nullable = false, length = 80)
    private String referencia;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CobrancaStatus status = CobrancaStatus.PENDENTE;

    @Column(name = "gateway_nome", length = 50)
    private String gatewayNome;

    @Column(name = "gateway_cobranca_id", length = 120)
    private String gatewayCobrancaId;

    @Column(name = "external_reference", length = 120)
    private String externalReference;

    @Column(name = "payment_link", length = 1000)
    private String paymentLink;

    @Column(length = 500)
    private String descricao;

    @Column(length = 1000)
    private String observacoes;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "last_webhook_at")
    private LocalDateTime lastWebhookAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
