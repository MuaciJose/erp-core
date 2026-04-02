package com.grandport.erp.modules.atendimento.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "atendimento_mensagens")
@Data
public class AtendimentoMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "autor_tipo", nullable = false, length = 40)
    private String autorTipo;

    @Column(name = "autor_nome", nullable = false, length = 160)
    private String autorNome;

    @Column(name = "autor_login", length = 160)
    private String autorLogin;

    @Column(name = "autor_perfil", length = 80)
    private String autorPerfil;

    @Column(name = "mensagem", nullable = false, columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "arquivo_nome", length = 255)
    private String arquivoNome;

    @Column(name = "arquivo_url", length = 500)
    private String arquivoUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
