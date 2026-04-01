package com.grandport.erp.modules.empresa.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresas")
@Data
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String razaoSocial;

    @Column(unique = true, nullable = false)
    private String cnpj;

    private String emailContato;
    private String telefone;

    private LocalDateTime dataCadastro = LocalDateTime.now();
    private Boolean ativo = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_assinatura", nullable = false)
    private StatusAssinatura statusAssinatura = StatusAssinatura.ATIVA;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento = LocalDate.now().plusDays(30);

    @Column(name = "motivo_bloqueio")
    private String motivoBloqueio;
}
