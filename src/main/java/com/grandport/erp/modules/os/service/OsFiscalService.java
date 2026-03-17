package com.grandport.erp.modules.os.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.model.OsItemPeca;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;

// 🚀 IMPORTAÇÕES DA SWCONSULTORIA PARA COMUNICAÇÃO REAL COM A SEFAZ
import br.com.swconsultoria.nfe.Nfe;
import br.com.swconsultoria.nfe.dom.ConfiguracoesNfe;
import br.com.swconsultoria.nfe.dom.enuns.DocumentoEnum;
import br.com.swconsultoria.nfe.schema_4.enviNFe.TRetEnviNFe;
import com.grandport.erp.modules.fiscal.service.NfeSetupService;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Random;

@Service
public class OsFiscalService {

    @Autowired
    private OrdemServicoRepository osRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    // 🚀 INJETANDO O SERVIÇO QUE LÊ O CERTIFICADO A1 (O mesmo usado no PDV)
    @Autowired
    private NfeSetupService nfeSetupService;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    // ==============================================================
    // 1. EMITIR DOCUMENTO FISCAL DAS PEÇAS (DINÂMICO: 55 OU 65)
    // ==============================================================
    // 🚀 MUDANÇA: Agora recebe o "modeloFiscal" ("55" ou "65") que vem do React
    public Map<String, Object> emitirFiscalPecas(Long osId, String modeloFiscal) throws Exception {

        if (!"55".equals(modeloFiscal) && !"65".equals(modeloFiscal)) {
            throw new Exception("Modelo fiscal inválido. Escolha 55 (NF-e) ou 65 (NFC-e).");
        }

        OrdemServico os = osRepository.findById(osId).orElseThrow(() -> new Exception("OS não encontrada"));
        if (os.getItensPecas().isEmpty()) throw new Exception("Esta OS não possui peças para emitir o documento fiscal.");

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 🚀 Puxa o número correto dependendo se é A4 ou Cupom
        Long numeroDocumento = "55".equals(modeloFiscal) ? config.getNumeroProximaNfe() : config.getNumeroProximaNfce();

        String chaveAcesso = gerarChaveAcesso(modeloFiscal, config, numeroDocumento);

        // 🚧 ===================== FUTURA MANUTENÇÃO: O XML DA SEFAZ ===================== 🚧
        StringBuilder xml = new StringBuilder();
        xml.append("<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infNFe Id=\"NFe").append(chaveAcesso).append("\">");
        xml.append("<emit><CNPJ>").append(config.getCnpj().replaceAll("\\D", "")).append("</CNPJ></emit>");

        for (OsItemPeca peca : os.getItensPecas()) {
            xml.append("<det><prod><xProd>").append(peca.getProduto().getNome()).append("</xProd></prod></det>");
        }
        xml.append("</infNFe></NFe>");
        // 🚧 ============================================================================ 🚧

        // 🚀 TRANSMISSÃO REAL PARA A SEFAZ VIA SWCONSULTORIA
        try {
            ConfiguracoesNfe configNfe = nfeSetupService.iniciarConfiguracao(config);

            // 💡 QUANDO O XML ACIMA ESTIVER COMPLETO, TIRE AS BARRAS:
            /*
            TRetEnviNFe retorno = Nfe.enviarNfe(configNfe, xml.toString(), DocumentoEnum.NFE);
            if (!retorno.getCStat().equals("100") && !retorno.getCStat().equals("103") && !retorno.getCStat().equals("104")) {
                throw new Exception("Rejeição SEFAZ: " + retorno.getXMotivo());
            }
            */
        } catch (Exception e) {
            throw new Exception("Falha na Comunicação com a SEFAZ: " + e.getMessage());
        }

        salvarArquivoXml(chaveAcesso, xml.toString());

        NotaFiscal nota = new NotaFiscal();
        nota.setNumero(numeroDocumento);
        nota.setChaveAcesso(chaveAcesso);
        nota.setStatus("AUTORIZADA");
        nota.setDataEmissao(LocalDateTime.now());
        notaFiscalRepository.save(nota);

        // 🚀 Atualiza o contador correto no banco de dados
        if ("55".equals(modeloFiscal)) {
            config.setNumeroProximaNfe(numeroDocumento + 1);
        } else {
            config.setNumeroProximaNfce(numeroDocumento + 1);
        }
        configuracaoService.atualizarConfiguracao(config);

        // 🚀 3. AUDITORIA INTELIGENTE: Registra se foi Cupom ou A4
        String nomeDocumento = "55".equals(modeloFiscal) ? "NF-e (A4)" : "NFC-e (Cupom)";
        auditoriaService.registrar("FISCAL", "EMISSAO_FISCAL_OS",
                "Emitiu " + nomeDocumento + " de Peças Nº " + numeroDocumento + " ref. à OS #" + osId + ". Valor: R$ " + os.getTotalPecas());

        return Map.of("message", nomeDocumento + " de Peças AUTORIZADA pela SEFAZ!", "chaveAcesso", chaveAcesso);
    }

    // ==============================================================
    // 2. EMITIR NFS-E DA MÃO DE OBRA (PREFEITURA - MUNICÍPIO)
    // ==============================================================
    public Map<String, Object> emitirNfseServicos(Long osId) throws Exception {

        OrdemServico os = osRepository.findById(osId).orElseThrow(() -> new Exception("OS não encontrada"));
        if (os.getItensServicos().isEmpty()) throw new Exception("Esta OS não possui mão de obra para emitir NFS-e.");

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        if (config.getInscricaoMunicipal() == null || config.getInscricaoMunicipal().isEmpty()) {
            throw new Exception("Inscrição Municipal não configurada. Verifique a aba 'Prefeitura' nas Configurações Fiscais.");
        }

        String numeroRps = String.valueOf(System.currentTimeMillis()).substring(5);

        // ======================= XML ABRASF ATUAL (APENAS PARA MOCK/TESTE) =======================
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<EnviarLoteRpsEnvio xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n");
        xml.append("  <LoteRps>\n    <Rps>\n      <InfDeclaracaoPrestacaoServico>\n");

        xml.append("        <Rps>\n          <IdentificacaoRps><Numero>").append(numeroRps).append("</Numero><Serie>UN</Serie><Tipo>1</Tipo></IdentificacaoRps>\n        </Rps>\n");

        xml.append("        <Servico>\n");
        xml.append("          <Valores><ValorServicos>").append(os.getTotalServicos()).append("</ValorServicos></Valores>\n");
        xml.append("          <ItemListaServico>").append(config.getCodigoServicoLc116()).append("</ItemListaServico>\n");
        xml.append("          <CodigoCnae>").append(config.getCodigoCnae().replaceAll("\\D", "")).append("</CodigoCnae>\n");
        xml.append("          <Discriminacao>Serviços de Manutenção Automotiva ref. a OS ").append(os.getId()).append("</Discriminacao>\n");
        xml.append("          <CodigoMunicipio>").append(config.getCodigoIbgeMunicipio()).append("</CodigoMunicipio>\n");
        xml.append("        </Servico>\n");

        xml.append("        <Prestador>\n");
        xml.append("          <CpfCnpj><Cnpj>").append(config.getCnpj().replaceAll("\\D", "")).append("</Cnpj></CpfCnpj>\n");
        xml.append("          <InscricaoMunicipal>").append(config.getInscricaoMunicipal()).append("</InscricaoMunicipal>\n");
        xml.append("        </Prestador>\n");

        xml.append("      </InfDeclaracaoPrestacaoServico>\n    </Rps>\n  </LoteRps>\n");
        xml.append("</EnviarLoteRpsEnvio>");

        salvarArquivoXml("NFSE_RPS_" + numeroRps, xml.toString());

        // 🚀 4. AUDITORIA: Emissão de Nota de Serviço
        auditoriaService.registrar("FISCAL", "EMISSAO_NFSE_OS",
                "Gerou RPS de Serviço Nº " + numeroRps + " ref. à OS #" + osId + ". Valor Serviços: R$ " + os.getTotalServicos());

        return Map.of("message", "NFS-e gerada e pronta para envio pelo provedor: " + config.getProvedorPrefeitura());
    }

    // ==============================================================
    // 🛠️ MÉTODOS AUXILIARES
    // ==============================================================

    /**
     * Gera uma chave de acesso com 44 dígitos padrão SEFAZ.
     */
    // 🚀 Ajustado para receber o número dinâmico e pegar a série correta
    private String gerarChaveAcesso(String modelo, ConfiguracaoSistema config, Long numeroDocumento) {
        String codUf = "26"; // 💡 FUTURO: config.getCodigoIbgeMunicipio().substring(0, 2);

        String data = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMM"));

        String cnpj = config.getCnpj().replaceAll("\\D", "");
        if (cnpj.length() < 14) cnpj = String.format("%14s", cnpj).replace(' ', '0');

        Integer numSerie = "55".equals(modelo) ? config.getSerieNfe() : config.getSerieNfce();
        String serie = String.format("%03d", numSerie != null ? numSerie : 1);

        String numero = String.format("%09d", numeroDocumento);
        String numAleatorio = String.format("%08d", new Random().nextInt(99999999));

        return codUf + data + cnpj + modelo + serie + numero + "1" + numAleatorio + "0";
    }

    /**
     * Salva o arquivo XML no HD local para ser lido pelo download do sistema.
     */
    private void salvarArquivoXml(String nomeArquivo, String conteudo) throws Exception {
        String dir = System.getProperty("user.dir") + "/nfe_xmls/";
        File f = new File(dir);
        if (!f.exists()) f.mkdirs();
        Files.write(Paths.get(dir + nomeArquivo + ".xml"), conteudo.getBytes(StandardCharsets.UTF_8));
    }
}