package com.grandport.erp.modules.admin.model; // ⚠️ O PACOTE DEVE SER EXATAMENTE ESTE

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "logs_auditoria", indexes = {
        @Index(name = "idx_log_data", columnList = "dataHora"),
        @Index(name = "idx_log_modulo", columnList = "modulo"),
        @Index(name = "idx_log_usuario", columnList = "usuarioNome")
})
@Data
public class LogAuditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dataHora;
    private String usuarioNome;
    private String modulo;
    private String acao;

    @Column(columnDefinition = "TEXT")
    private String detalhes;

    private String ipOrigem;
}