package com.grandport.erp.modules.empresa.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
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
    private LocalDateTime dataDesligamento;
    private Boolean ativo = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_assinatura", nullable = false)
    private StatusAssinatura statusAssinatura = StatusAssinatura.ATIVA;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento = LocalDate.now().plusDays(30);

    @Column(name = "motivo_bloqueio")
    private String motivoBloqueio;

    @Column(name = "plano", nullable = false)
    private String plano = "ESSENCIAL";

    @Column(name = "valor_mensal", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorMensal = BigDecimal.ZERO;

    @Column(name = "dias_tolerancia", nullable = false)
    private Integer diasTolerancia = 0;
}
