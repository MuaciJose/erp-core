package com.grandport.erp.modules.configuracoes.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "configuracoes_sistema")
@Data
@EqualsAndHashCode(callSuper = true)
public class ConfiguracaoSistema extends BaseEntityMultiEmpresa {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY, generator = "configuracoes_sistema_id_seq")
    @SequenceGenerator(name = "configuracoes_sistema_id_seq", sequenceName = "configuracoes_sistema_id_seq", allocationSize = 1)
    private Long id;  // 🔐 Cada empresa terá suas próprias configs com IDs auto-gerados

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
    private String cep = "";
    private String logradouro = "";
    private String numero = "";
    private String bairro = "";
    private String cidade = "";
    private String uf = "";
    private String codigoIbgeMunicipio = "";

    // ================= FISCAL / EMISSÃO NF-E (Modelo 55) =================
    @Column(length = 1)
    private String crt = "1"; // 1 = Simples Nacional, 3 = Regime Normal

    private Integer ambienteSefaz = 2; // 1 = Produção (Real), 2 = Homologação (Testes)
    private Integer serieNfe = 1;
    private Long numeroProximaNfe = 1L;

    // 🚀 NOVOS CAMPOS PARA O CUPOM FISCAL (NFC-e - Modelo 65)
    // Mantendo a contagem separada da NF-e como manda a SEFAZ
    private Integer serieNfce = 1;
    private Long numeroProximaNfce = 1L;

    // Dados do Token CSC (Para gerar o QR Code da NFC-e)
    private String cscIdToken; // Ex: "000001"
    private String cscCodigo;  // Ex: "A1B2C3D4-E5F6..."

    @Column(length = 2)
    private String tipoCertificado = "A1";
    private String senhaCertificado = "";

    // =======================================================
    // 🚀 FISCAL PREFEITURA (NFS-e - SERVIÇOS / MÃO DE OBRA)
    // =======================================================
    private String inscricaoMunicipal = "";
    private String codigoCnae = "";
    private String codigoServicoLc116 = "14.01";
    private String aliquotaIss = "";
    private String provedorPrefeitura = "PADRAO_NACIONAL";
    private Integer ambienteNfse = 2; // 1 = Produção, 2 = Homologação
    private String loginPrefeitura = "";
    private String senhaPrefeitura = "";

    // 🚀 REFORMA TRIBUTÁRIA / LEI DA TRANSPARÊNCIA
    @Column(name = "exibir_iva_dual", columnDefinition = "boolean default false")
    private Boolean exibirIvaDual = false;


    // ================= VISUAL =================
    private String logoUrl = "";

    @Column(columnDefinition = "TEXT")
    private String logoBase64;

    // ================= IMPRESSÃO E CUPOM =================
    private String tamanhoImpressora = "80mm";

    @Column(columnDefinition = "TEXT")
    private String mensagemRodape = "Obrigado pela preferência! Volte sempre.";
    private Boolean exibirVendedorCupom = true;

    @Column(columnDefinition = "TEXT")
    private String layoutHtmlOs = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>body { font-family: Arial, sans-serif; }</style></head><body><h1>Ordem de Serviço #<span th:text=\"${os.id}\"></span></h1><p>Cliente: <span th:text=\"${os.cliente != null ? os.cliente.nome : 'Consumidor Final'}\"></span></p><p>Total: R$ <span th:text=\"${#numbers.formatDecimal(os.valorTotal, 1, 'POINT', 2, 'COMMA')}\"></span></p></body></html>";

    // 🚀 NOVO: LAYOUT DOS PEDIDOS E VENDAS DO CAIXA
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlVenda = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/></head><body><h1>Pedido de Venda #<span th:text=\"${venda.id}\"></span></h1><p>Vá em configurações para personalizar o layout da Venda!</p></body></html>";

    // 🚀 NOVO: LAYOUT DO RELATÓRIO DE COMISSÕES (RH)
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlRelatorioComissao;

    // ================= REGRAS DE NEGÓCIO =================
    @Column(precision = 5, scale = 2)
    private BigDecimal descontoMaximoPermitido = new BigDecimal("10.00");

    private Boolean permitirEstoqueNegativoGlobal = false;
    private Integer diasValidadeOrcamento = 5;

    // ================= MANUTENÇÃO E SISTEMA =================
    private String horarioBackupAuto = "03:00";

    // ================= VENDEDORES E COMISSÕES =================
    @ElementCollection(fetch = FetchType.EAGER)
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

    private String smtpHost; // Ex: smtp.gmail.com
    private Integer smtpPort; // Ex: 587
    private String emailRemetente;
    private String senhaEmailRemetente; // Deve ser a "Senha de Aplicativo"


    // 🚀 NOVO: LAYOUT DO FECHAMENTO DE CAIXA (CUPOM 80mm)
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlFechamentoCaixa;


    // 🚀 NOVO: LAYOUT DO ESPELHO DA NOTA (A4)
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlEspelhoNota;

    // 🚀 NOVO: LAYOUT DO DRE (A4)
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlDre;

    // 🚀 NOVO: LAYOUT DO RECIBO AVULSO (A4 Paisagem)
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlRecibo;

    @Column(columnDefinition = "TEXT")
    private String layoutHtmlReciboPagamento;

    @Column(columnDefinition = "TEXT")
    private String layoutHtmlRelatorioContasPagar;

    @Column(columnDefinition = "TEXT")
    private String layoutHtmlRelatorioContasReceber;

    // 🚀 NOVO: LAYOUT DO EXTRATO FINANCEIRO DE CLIENTES
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlExtratoCliente;

    // 🚀 NOVO: LAYOUT DO EXTRATO FINANCEIRO DE FORNECEDORES
    @Column(columnDefinition = "TEXT")
    private String layoutHtmlExtratoFornecedor;

    @Column
    private String whatsappInstancia;


    @Column(columnDefinition = "TEXT")
    private String mensagemWhatsapp;
    public String getMensagemWhatsapp() { return mensagemWhatsapp; }
    public void setMensagemWhatsapp(String mensagemWhatsapp) { this.mensagemWhatsapp = mensagemWhatsapp; }







}

