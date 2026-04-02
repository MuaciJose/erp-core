package com.grandport.erp.modules.assinatura.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresa_modulo_licencas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_empresa_modulo_licenca", columnNames = {"empresa_id", "modulo"})
}, indexes = {
        @Index(name = "idx_empresa_modulo_licenca_empresa", columnList = "empresa_id"),
        @Index(name = "idx_empresa_modulo_licenca_modulo", columnList = "modulo")
})
@Data
public class LicencaModuloEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(nullable = false, length = 80)
    private String modulo;

    @Column(nullable = false)
    private Boolean ativo = Boolean.TRUE;

    @Column(length = 500)
    private String observacao;

    @Column(name = "valor_mensal_extra", precision = 12, scale = 2)
    private BigDecimal valorMensalExtra = BigDecimal.ZERO;

    @Column(name = "trial_ate")
    private LocalDate trialAte;

    @Column(name = "bloqueado_comercial", nullable = false)
    private Boolean bloqueadoComercial = Boolean.FALSE;

    @Column(name = "motivo_bloqueio_comercial", length = 500)
    private String motivoBloqueioComercial;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "updated_by", length = 120)
    private String updatedBy;
}
