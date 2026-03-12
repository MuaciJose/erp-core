package com.grandport.erp.modules.configuracoes.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "configuracoes_sistema")
@Data
public class ConfiguracaoSistema {

    @Id
    private Long id = 1L;

    // ================= DADOS DA EMPRESA =================
    private String nomeFantasia = "Minha Autopeças";
    private String razaoSocial = "";
    private String cnpj = "";
    private String inscricaoEstadual = "";
    private String telefone = "";
    private String email = "";

    // Endereço Antigo (Texto livre)
    @Column(columnDefinition = "TEXT")
    private String endereco = "";

    // Endereço Novo (Estruturado - Exigência SEFAZ)
    private String cep = ""; // 🚀 ADICIONADO
    private String logradouro = "";
    private String numero = "";
    private String bairro = "";
    private String cidade = "";
    private String uf = "";
    private String codigoIbgeMunicipio = ""; // 🚀 ADICIONADO (Ex: 2600054 para Abreu e Lima/PE)

    // ================= FISCAL / EMISSÃO NF-E =================
    @Column(length = 1)
    private String crt = "1"; // 🚀 ADICIONADO: 1 = Simples Nacional, 3 = Regime Normal

    private Integer ambienteSefaz = 2; // 🚀 ADICIONADO: 1 = Produção (Real), 2 = Homologação (Testes)
    private Integer serieNfe = 1; // 🚀 ADICIONADO: Série padrão da nota
    private Long numeroProximaNfe = 1L; // 🚀 ADICIONADO: ERP vai somar +1 a cada nota emitida

    @Column(length = 2)
    private String tipoCertificado = "A1";
    private String senhaCertificado = "";

    // ================= VISUAL =================
    private String logoUrl = "";

    @Column(columnDefinition = "TEXT")
    private String logoBase64;

    // ================= IMPRESSÃO E CUPOM =================
    private String tamanhoImpressora = "80mm";

    @Column(columnDefinition = "TEXT")
    private String mensagemRodape = "Obrigado pela preferência! Volte sempre.";
    private Boolean exibirVendedorCupom = true;

    // ================= REGRAS DE NEGÓCIO =================
    @Column(precision = 5, scale = 2)
    private BigDecimal descontoMaximoPermitido = new BigDecimal("10.00");

    private Boolean permitirEstoqueNegativoGlobal = false;
    private Integer diasValidadeOrcamento = 5;

    // ================= MANUTENÇÃO E SISTEMA =================
    private String horarioBackupAuto = "03:00";

    // ================= VENDEDORES E COMISSÕES =================
    @ElementCollection
    @CollectionTable(
            name = "configuracao_vendedores_comissao",
            joinColumns = @JoinColumn(name = "configuracao_id")
    )
    private List<VendedorComissao> vendedores = new ArrayList<>();

    // ================= INTEGRAÇÕES E APIS =================
    @Column(length = 1000)
    private String whatsappToken = "";

    @Column(length = 1000)
    private String whatsappApiUrl = "";

    // 🚀 NOVOS CAMPOS PARA O CUPOM FISCAL (NFC-e)
    @Column(name = "csc_id", length = 6)
    private String cscId; // Ex: "000001"

    @Column(name = "csc_token")
    private String cscToken; // Ex: "A1B2C3D4-E5F6..."
}