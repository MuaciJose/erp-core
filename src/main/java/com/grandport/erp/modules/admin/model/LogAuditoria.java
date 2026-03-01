package com.grandport.erp.modules.admin.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "logs_auditoria")
@Data
public class LogAuditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDateTime dataHora;
    private String usuarioNome;
    private String modulo; // FINANCEIRO, ESTOQUE, PDV, etc.
    private String acao; // CRIACAO, EDICAO, EXCLUSAO, BAIXA, etc.
    
    @Column(columnDefinition = "TEXT")
    private String detalhes;
    
    private String ipOrigem;
}
