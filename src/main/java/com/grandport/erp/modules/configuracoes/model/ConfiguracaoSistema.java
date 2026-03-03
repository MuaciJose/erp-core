package com.grandport.erp.modules.configuracoes.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "configuracoes_sistema")
@Data
public class ConfiguracaoSistema {

    @Id
    private Long id = 1L; // Sempre será 1 (Configuração única da empresa)

    // ================= DADOS DA EMPRESA =================
    private String nomeFantasia = "Minha Autopeças";
    private String razaoSocial = "";
    private String cnpj = "";
    private String inscricaoEstadual = "";
    private String telefone = "";
    private String email = "";

    @Column(columnDefinition = "TEXT")
    private String endereco = "";

    // ================= VISUAL =================
    private String logoUrl = ""; // Caminho da imagem da logo

    // ================= IMPRESSÃO E CUPOM =================
    private String tamanhoImpressora = "80mm"; // 80mm, 58mm ou A4

    @Column(columnDefinition = "TEXT")
    private String mensagemRodape = "Obrigado pela preferência! Volte sempre.";
    private Boolean exibirVendedorCupom = true;

    // ================= REGRAS DE NEGÓCIO =================
    @Column(precision = 5, scale = 2)
    private BigDecimal descontoMaximoPermitido = new BigDecimal("10.00"); // 10%

    private Boolean permitirEstoqueNegativoGlobal = false;
    private Integer diasValidadeOrcamento = 5;

    @Column(columnDefinition = "TEXT")
    private String logoBase64;

    // ================= MANUTENÇÃO E SISTEMA =================
    private String horarioBackupAuto = "03:00"; // Adicionado para suportar o Backup Automático agendado
}