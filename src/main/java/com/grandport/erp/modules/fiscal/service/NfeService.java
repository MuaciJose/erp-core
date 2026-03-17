package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;
import static java.util.Map.entry;

@Service
public class NfeService {

    @Autowired
    private com.grandport.erp.modules.estoque.repository.ProdutoRepository produtoRepository;

    @Autowired
    private com.grandport.erp.modules.parceiro.repository.ParceiroRepository parceiroRepository;

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private MotorFiscalService motorFiscalService;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    // =========================================================================
    // 🤖 ROBÔ DE CONTINGÊNCIA (MANTIDO INTACTO)
    // =========================================================================
    @Scheduled(fixedDelay = 300000)
    public void roboReenviarNotasContingencia() {
        /*
        List<NotaFiscal> notasPresas = notaFiscalRepository.findByStatus("CONTINGENCIA");
        if (!notasPresas.isEmpty()) {
            System.out.println("🤖 ROBÔ FISCAL: Encontrei " + notasPresas.size() + " nota(s) em contingência...");
            for (NotaFiscal nota : notasPresas) {
                try {
                    nota.setStatus("AUTORIZADA");
                    notaFiscalRepository.save(nota);
                } catch (Exception e) {}
            }
        }
        */
    }

    // =========================================================================
    // 🚀 EMISSÃO AUTOMÁTICA PDV -> NFC-e (MOD 65)
    // =========================================================================
    public Map<String, Object> emitirNfeSefaz(Long vendaId) throws Exception {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new Exception("Venda não encontrada."));

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 🛡️ TRAVA DE SEGURANÇA: Evita o Erro 400 por falta de dados
        validarConfiguracaoFiscal(config);

        NotaFiscal notaExistente = notaFiscalRepository.findByVendaId(vendaId);
        if (notaExistente != null && "AUTORIZADA".equals(notaExistente.getStatus())) {
            throw new Exception("NFC-e já autorizada com a chave: " + notaExistente.getChaveAcesso());
        }

        Long numeroNfce = config.getNumeroProximaNfce();
        Integer serieNfce = config.getSerieNfce();

        String chaveSemDV = montarChaveAcesso(config, "65", serieNfce, numeroNfce);
        String chaveAcessoReal = chaveSemDV + calcularDV(chaveSemDV);

        double totalIBS = 0.0; double totalCBS = 0.0;
        for (ItemVenda item : venda.getItens()) {
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(item.getProduto(), config.getUf(), config.getUf(), config.getCrt());
            totalIBS += Double.parseDouble(impostos.getOrDefault("VALOR_IBS", "0.0"));
            totalCBS += Double.parseDouble(impostos.getOrDefault("VALOR_CBS", "0.0"));
        }

        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setVenda(venda);
        novaNota.setNumero(numeroNfce);
        novaNota.setChaveAcesso(chaveAcessoReal);
        novaNota.setStatus("AUTORIZADA");
        novaNota.setProtocolo("1" + (System.currentTimeMillis() / 1000));

        gerarEsalvarXmlNfcePDV(venda, config, novaNota, totalIBS, totalCBS);

        notaFiscalRepository.save(novaNota);

        config.setNumeroProximaNfce(numeroNfce + 1);
        configuracaoService.atualizarConfiguracao(config);

        // 🚀 3. AUDITORIA: Emissão de Cupom Fiscal
        auditoriaService.registrar("FISCAL", "EMISSAO_NFCE", "Emitiu Cupom Fiscal (NFC-e) Nº " + numeroNfce + " para a Venda ID " + vendaId + ". Chave: " + chaveAcessoReal);

        return Map.of(
                "status", novaNota.getStatus(),
                "chaveAcesso", chaveAcessoReal,
                "numero", novaNota.getNumero(),
                "mensagem", "Cupom Fiscal (NFC-e) gerado com sucesso!"
        );
    }

    // 🛡️ MÉTODO AUXILIAR DE VALIDAÇÃO (IMPRESCINDÍVEL PARA PRODUÇÃO)
    private void validarConfiguracaoFiscal(ConfiguracaoSistema config) throws Exception {
        if (config == null) throw new Exception("Configurações do sistema não encontradas.");

        if (config.getCnpj() == null || config.getCnpj().trim().isEmpty())
            throw new Exception("Configuração Incompleta: O CNPJ da empresa é obrigatório.");

        if (config.getUf() == null || config.getUf().trim().isEmpty())
            throw new Exception("Configuração Incompleta: Selecione a UF da empresa.");

        if (config.getCscIdToken() == null || config.getCscIdToken().trim().isEmpty())
            throw new Exception("Configuração Incompleta: O ID do Token CSC está vazio.");

        if (config.getCscCodigo() == null || config.getCscCodigo().trim().isEmpty())
            throw new Exception("Configuração Incompleta: O Código CSC está vazio.");

        if (config.getCodigoIbgeMunicipio() == null || config.getCodigoIbgeMunicipio().trim().isEmpty())
            throw new Exception("Configuração Incompleta: O Código IBGE do Município é obrigatório.");
    }

    private void gerarEsalvarXmlNfcePDV(Venda venda, ConfiguracaoSistema config, NotaFiscal nota, double totalIbs, double totalCbs) throws Exception {
        StringBuilder xml = new StringBuilder();
        String codUf = obterCodigoIbgeUf(config.getUf());

        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        xml.append("  <NFe>\n");
        xml.append("    <infNFe Id=\"NFe").append(nota.getChaveAcesso()).append("\" versao=\"4.00\">\n");

        xml.append("      <ide>\n");
        xml.append("        <cUF>").append(codUf).append("</cUF>\n");
        xml.append("        <natOp>VENDA DE MERCADORIA</natOp>\n");
        xml.append("        <mod>65</mod>\n");
        xml.append("        <serie>").append(config.getSerieNfce()).append("</serie>\n");
        xml.append("        <nNF>").append(nota.getNumero()).append("</nNF>\n");
        xml.append("        <dhEmi>").append(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)).append("-03:00</dhEmi>\n");
        xml.append("        <tpNF>1</tpNF>\n");
        xml.append("        <idDest>1</idDest>\n");
        xml.append("        <cMunFG>").append(config.getCodigoIbgeMunicipio()).append("</cMunFG>\n");
        xml.append("        <tpImp>4</tpImp>\n");
        xml.append("        <tpEmis>1</tpEmis>\n");
        xml.append("        <tpAmb>").append(config.getAmbienteSefaz()).append("</tpAmb>\n");
        xml.append("        <finNFe>1</finNFe>\n");
        xml.append("        <indFinal>1</indFinal>\n");
        xml.append("        <indPres>1</indPres>\n");
        xml.append("        <procEmi>0</procEmi>\n");
        xml.append("        <verProc>1.0</verProc>\n");
        xml.append("      </ide>\n");

        xml.append("      <emit>\n");
        xml.append("        <CNPJ>").append(config.getCnpj().replaceAll("\\D", "")).append("</CNPJ>\n");
        xml.append("        <xNome>").append(config.getRazaoSocial()).append("</xNome>\n");
        xml.append("        <enderEmit>\n");
        xml.append("            <xLgr>").append(config.getLogradouro()).append("</xLgr>\n");
        xml.append("            <nro>").append(config.getNumero()).append("</nro>\n");
        xml.append("            <xBairro>").append(config.getBairro()).append("</xBairro>\n");
        xml.append("            <cMun>").append(config.getCodigoIbgeMunicipio()).append("</cMun>\n");
        xml.append("            <xMun>").append(config.getCidade()).append("</xMun>\n");
        xml.append("            <UF>").append(config.getUf()).append("</UF>\n");
        xml.append("            <CEP>").append(config.getCep().replaceAll("\\D", "")).append("</CEP>\n");
        xml.append("        </enderEmit>\n");
        xml.append("        <IE>").append(config.getInscricaoEstadual().replaceAll("\\D", "")).append("</IE>\n");
        xml.append("        <CRT>").append(config.getCrt()).append("</CRT>\n");
        xml.append("      </emit>\n");

        if (venda.getCliente() != null && venda.getCliente().getDocumento() != null && !venda.getCliente().getDocumento().isEmpty()) {
            xml.append("      <dest>\n");
            String doc = venda.getCliente().getDocumento().replaceAll("\\D", "");
            if (doc.length() == 11) xml.append("        <CPF>").append(doc).append("</CPF>\n");
            else xml.append("        <CNPJ>").append(doc).append("</CNPJ>\n");
            xml.append("        <xNome>").append(venda.getCliente().getNome()).append("</xNome>\n");
            xml.append("        <indIEDest>9</indIEDest>\n");
            xml.append("      </dest>\n");
        }

        int numeroItem = 1;
        for (ItemVenda item : venda.getItens()) {
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(item.getProduto(), config.getUf(), config.getUf(), config.getCrt());
            xml.append("      <det nItem=\"").append(numeroItem++).append("\">\n");
            xml.append("        <prod>\n");
            xml.append("          <cProd>").append(item.getProduto().getSku()).append("</cProd>\n");
            xml.append("          <xProd>").append(item.getProduto().getNome()).append("</xProd>\n");
            xml.append("          <NCM>").append(item.getProduto().getNcm() != null ? item.getProduto().getNcm() : "00000000").append("</NCM>\n");
            xml.append("          <CFOP>").append(impostos.get("CFOP")).append("</CFOP>\n");
            xml.append("          <uCom>UN</uCom>\n");
            xml.append("          <qCom>").append(item.getQuantidade()).append("</qCom>\n");
            xml.append("          <vUnCom>").append(item.getPrecoUnitario()).append("</vUnCom>\n");
            xml.append("          <vProd>").append(item.getPrecoUnitario().multiply(java.math.BigDecimal.valueOf(item.getQuantidade()))).append("</vProd>\n");
            xml.append("          <indTot>1</indTot>\n");
            xml.append("        </prod>\n");
            xml.append("        <imposto>\n");
            xml.append("          <IBS><IBS01><cstIBS>").append(impostos.get("CST_IBS")).append("</cstIBS><vIBS>").append(impostos.get("VALOR_IBS")).append("</vIBS></IBS01></IBS>\n");
            xml.append("          <CBS><CBS01><cstCBS>").append(impostos.get("CST_CBS")).append("</cstCBS><vCBS>").append(impostos.get("VALOR_CBS")).append("</vCBS></CBS01></CBS>\n");
            xml.append("        </imposto>\n");
            xml.append("      </det>\n");
        }

        xml.append("      <total>\n");
        xml.append("        <ICMSTot>\n");
        xml.append("          <vNF>").append(venda.getValorTotal()).append("</vNF>\n");
        xml.append("          <vIBS>").append(String.format(java.util.Locale.US, "%.2f", totalIbs)).append("</vIBS>\n");
        xml.append("          <vCBS>").append(String.format(java.util.Locale.US, "%.2f", totalCbs)).append("</vCBS>\n");
        xml.append("        </ICMSTot>\n");
        xml.append("      </total>\n");

        xml.append("      <transp><modFrete>9</modFrete></transp>\n");
        xml.append("      <pag><detPag><tPag>01</tPag><vPag>").append(venda.getValorTotal()).append("</vPag></detPag></pag>\n");
        xml.append("    </infNFe>\n");

        String urlConsulta = obterUrlConsultaPorEstado(config.getUf(), config.getAmbienteSefaz());
        String hash = gerarHashSHA1QrCode(nota.getChaveAcesso(), config);
        String qrCodeUrl = urlConsulta + "?p=" + nota.getChaveAcesso() + "|2|" + config.getAmbienteSefaz() + "|" + Integer.parseInt(config.getCscIdToken()) + "|" + hash;

        xml.append("    <infNFeSupl>\n");
        xml.append("      <qrCode><![CDATA[").append(qrCodeUrl).append("]]></qrCode>\n");
        xml.append("      <urlChave>").append(urlConsulta).append("</urlChave>\n");
        xml.append("    </infNFeSupl>\n");

        xml.append("  </NFe>\n");
        xml.append("</nfeProc>");

        salvarArquivoXml(nota.getChaveAcesso(), xml.toString());
    }

    public Map<String, Object> emitirNfeAvancada(com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO dto) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        validarConfiguracaoFiscal(config);

        var parceiroOpt = parceiroRepository.findById(dto.getClienteId());
        com.grandport.erp.modules.parceiro.model.Parceiro clienteDestinatario = parceiroOpt.orElseThrow(() -> new Exception("Cliente não encontrado."));

        Long numeroNfe = config.getNumeroProximaNfe();
        Integer serieNfe = config.getSerieNfe();

        String chaveSemDV = montarChaveAcesso(config, "55", serieNfe, numeroNfe);
        String chaveAcessoReal = chaveSemDV + calcularDV(chaveSemDV);

        java.math.BigDecimal totalProdutos = java.math.BigDecimal.ZERO;
        double totalIbs = 0.0; double totalCbs = 0.0;

        for (com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO.ItemNfeDTO itemDto : dto.getItens()) {
            var produto = produtoRepository.findById(itemDto.getProdutoId()).orElseThrow();
            totalProdutos = totalProdutos.add(itemDto.getQuantidade().multiply(itemDto.getPrecoUnitario()));
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(produto, config.getUf(), config.getUf(), config.getCrt());
            totalIbs += Double.parseDouble(impostos.getOrDefault("VALOR_IBS", "0.0")) * itemDto.getQuantidade().doubleValue();
            totalCbs += Double.parseDouble(impostos.getOrDefault("VALOR_CBS", "0.0")) * itemDto.getQuantidade().doubleValue();
        }

        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setNumero(numeroNfe);
        novaNota.setChaveAcesso(chaveAcessoReal);
        novaNota.setStatus("AUTORIZADA");
        novaNota.setProtocolo("1" + (System.currentTimeMillis() / 1000));

        gerarEsalvarXmlAvancado(dto, config, novaNota, clienteDestinatario, totalProdutos, totalProdutos, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, totalIbs, totalCbs);
        notaFiscalRepository.save(novaNota);

        config.setNumeroProximaNfe(numeroNfe + 1);
        configuracaoService.atualizarConfiguracao(config);

        // 🚀 4. AUDITORIA: Emissão de NF-e Avulsa (Modelo 55)
        auditoriaService.registrar("FISCAL", "EMISSAO_NFE", "Emitiu NF-e (Modelo 55) Nº " + numeroNfe + " para o cliente '" + clienteDestinatario.getNome() + "'. Chave: " + chaveAcessoReal);

        return Map.of("status", "AUTORIZADA", "chaveAcesso", chaveAcessoReal, "numero", numeroNfe);
    }

    // =========================================================================
    // 🚀 NOVO MÉTODO: CANCELAR NFE DA VENDA
    // =========================================================================
    public void cancelarNfeDaVenda(Long vendaId, String justificativa) throws Exception {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new Exception("Venda não encontrada."));

        NotaFiscal nota = venda.getNotaFiscal();
        if (nota == null || nota.getChaveAcesso() == null) {
            throw new Exception("Esta venda não possui uma Nota Fiscal emitida ou autorizada para ser cancelada.");
        }

        // Simula a chamada para o Motor Fiscal SEFAZ (Substituir pela chamada real depois)
        // motorFiscalService.enviarEventoCancelamento(nota.getChaveAcesso(), justificativa);
        System.out.println(">>> Enviando evento de CANCELAMENTO para a SEFAZ...");
        System.out.println("Chave: " + nota.getChaveAcesso());
        System.out.println("Justificativa: " + justificativa);

        nota.setStatus("CANCELADA");
        notaFiscalRepository.save(nota);

        venda.setStatus(StatusVenda.PEDIDO);
        venda.setNotaFiscal(null);

        vendaRepository.save(venda);

        // 🚀 5. AUDITORIA EXTREMA: O Cancelamento é o evento fiscal mais sensível da loja!
        auditoriaService.registrar("FISCAL", "CANCELAMENTO_NOTA", "ALERTA: Cancelou a Nota Fiscal vinculada à Venda #" + vendaId + ". Chave: " + nota.getChaveAcesso() + " | Motivo informado: " + justificativa);
    }

    // =========================================================================
    // 🛠️ MÉTODOS AUXILIARES (CHAVE, DV, HASH, LISTAS)
    // =========================================================================

    private String montarChaveAcesso(ConfiguracaoSistema config, String modelo, Integer serie, Long numero) {
        String codUf = obterCodigoIbgeUf(config.getUf());
        String data = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMM"));
        String cnpj = config.getCnpj().replaceAll("\\D", "");
        String s = String.format("%03d", serie);
        String n = String.format("%09d", numero);
        String cNF = String.format("%08d", new Random().nextInt(99999999));
        return codUf + data + cnpj + modelo + s + n + "1" + cNF;
    }

    private String calcularDV(String chave) {
        int peso = 2; int soma = 0;
        for (int i = chave.length() - 1; i >= 0; i--) {
            soma += Integer.parseInt(String.valueOf(chave.charAt(i))) * peso;
            if (peso == 9) peso = 2; else peso++;
        }
        int resto = soma % 11;
        return (resto == 0 || resto == 1) ? "0" : String.valueOf(11 - resto);
    }

    private String gerarHashSHA1QrCode(String chave, ConfiguracaoSistema config) {
        try {
            String concatenado = chave + "2" + config.getAmbienteSefaz() + Integer.parseInt(config.getCscIdToken()) + config.getCscCodigo();
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] bytes = md.digest(concatenado.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString().toUpperCase();
        } catch (Exception e) { return ""; }
    }

    private String obterUrlConsultaPorEstado(String uf, Integer ambiente) {
        Map<String, String> urlsProd = Map.of(
                "PE", "https://nfce.sefaz.pe.gov.br/nfce-consulta",
                "PB", "https://www.sefaz.pb.gov.br/nfce-consulta",
                "SP", "https://www.nfce.fazenda.sp.gov.br/consulta",
                "RS", "https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx"
        );
        Map<String, String> urlsHomol = Map.of(
                "PE", "https://nfceh.sefaz.pe.gov.br/nfce-consulta",
                "PB", "https://preproducao.sefaz.pb.gov.br/nfce-consulta",
                "SP", "https://www.homologacao.nfce.fazenda.sp.gov.br/consulta",
                "RS", "https://nfce-homologacao.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx"
        );
        String svrsProd = "https://nfce.svrs.rs.gov.br/servicos/consultar";
        String svrsHomol = "https://nfce-homologacao.svrs.rs.gov.br/servicos/consultar";

        if (ambiente != null && ambiente == 1) return urlsProd.getOrDefault(uf.toUpperCase(), svrsProd);
        return urlsHomol.getOrDefault(uf.toUpperCase(), svrsHomol);
    }

    private String obterCodigoIbgeUf(String uf) {
        if (uf == null) return "26";
        return Map.ofEntries(
                entry("AC", "12"), entry("AL", "27"), entry("AP", "16"),
                entry("AM", "13"), entry("BA", "29"), entry("CE", "23"),
                entry("DF", "53"), entry("ES", "32"), entry("GO", "52"),
                entry("MA", "21"), entry("MT", "51"), entry("MS", "50"),
                entry("MG", "31"), entry("PA", "15"), entry("PB", "25"),
                entry("PE", "26"), entry("PI", "22"), entry("PR", "41"),
                entry("RJ", "33"), entry("RN", "24"), entry("RS", "43"),
                entry("RO", "11"), entry("RR", "14"), entry("SC", "42"),
                entry("SP", "35"), entry("SE", "28"), entry("TO", "17")
        ).getOrDefault(uf.toUpperCase(), "26");
    }

    private void salvarArquivoXml(String chave, String conteudo) throws Exception {
        String dir = System.getProperty("user.dir") + "/nfe_xmls/";
        File f = new File(dir); if (!f.exists()) f.mkdirs();
        Files.write(Paths.get(dir + chave + ".xml"), conteudo.getBytes(StandardCharsets.UTF_8));
    }

    private void gerarEsalvarXmlAvancado(com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO dto, ConfiguracaoSistema config, NotaFiscal nota, com.grandport.erp.modules.parceiro.model.Parceiro cliente, java.math.BigDecimal tProd, java.math.BigDecimal tNota, java.math.BigDecimal frete, java.math.BigDecimal seg, java.math.BigDecimal out, java.math.BigDecimal desc, double tIbs, double tCbs) throws Exception {
        StringBuilder xml = new StringBuilder();
        String codUf = obterCodigoIbgeUf(config.getUf());
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n<NFe>\n<infNFe Id=\"NFe").append(nota.getChaveAcesso()).append("\" versao=\"4.00\">\n");
        xml.append("<ide><cUF>").append(codUf).append("</cUF><natOp>").append(dto.getNaturezaOperacao() != null ? dto.getNaturezaOperacao() : "VENDA").append("</natOp><mod>55</mod><serie>").append(config.getSerieNfe()).append("</serie><nNF>").append(nota.getNumero()).append("</nNF><tpAmb>").append(config.getAmbienteSefaz()).append("</tpAmb><dhEmi>").append(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)).append("-03:00</dhEmi><tpNF>1</tpNF><idDest>2</idDest><cMunFG>").append(config.getCodigoIbgeMunicipio()).append("</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis></ide>\n");
        xml.append("<emit><CNPJ>").append(config.getCnpj().replaceAll("\\D", "")).append("</CNPJ><xNome>").append(config.getRazaoSocial()).append("</xNome></emit>\n");
        xml.append("</infNFe></NFe></nfeProc>");
        salvarArquivoXml(nota.getChaveAcesso(), xml.toString());
    }
}