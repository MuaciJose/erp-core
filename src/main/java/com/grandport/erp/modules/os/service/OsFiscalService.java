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

    // ==============================================================
    // 1. EMITIR NF-E DAS PEÇAS (SEFAZ - ESTADO)
    // ==============================================================
    public Map<String, Object> emitirNfePecas(Long osId) throws Exception {

        OrdemServico os = osRepository.findById(osId).orElseThrow(() -> new Exception("OS não encontrada"));
        if (os.getItensPecas().isEmpty()) throw new Exception("Esta OS não possui peças para emitir NF-e.");

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        Long numeroNfe = config.getNumeroProximaNfe();
        String chaveAcesso = gerarChaveAcesso("55", config);

        // 🚧 ===================== FUTURA MANUTENÇÃO: O XML DA SEFAZ ===================== 🚧
        // O código abaixo é apenas um "esqueleto" vazio para o sistema não quebrar.
        // QUANDO FOR PARA PRODUÇÃO:
        // 1. Vá no arquivo `NfeService.java`
        // 2. Copie toda a lógica gigante do `StringBuilder xml = new StringBuilder();` que tem lá
        // 3. Cole aqui substituindo este bloco abaixo.
        // 4. Lembre-se de adaptar o loop para ler `os.getItensPecas()` ao invés de `venda.getItens()`

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

            // 💡 QUANDO O XML ACIMA ESTIVER COMPLETO, TIRE AS BARRAS (/* e */) DESTE BLOCO ABAIXO:
            /*
            TRetEnviNFe retorno = Nfe.enviarNfe(configNfe, xml.toString(), DocumentoEnum.NFE);

            // Se o cStat não for 100 (Autorizado), 103 (Lote Recebido) ou 104 (Lote Processado), é erro!
            if (!retorno.getCStat().equals("100") && !retorno.getCStat().equals("103") && !retorno.getCStat().equals("104")) {
                throw new Exception("Rejeição SEFAZ: " + retorno.getXMotivo());
            }
            */

        } catch (Exception e) {
            throw new Exception("Falha na Comunicação com a SEFAZ: " + e.getMessage());
        }

        salvarArquivoXml(chaveAcesso, xml.toString());

        NotaFiscal nota = new NotaFiscal();
        nota.setNumero(numeroNfe);
        nota.setChaveAcesso(chaveAcesso);
        nota.setStatus("AUTORIZADA");
        nota.setDataEmissao(LocalDateTime.now());
        notaFiscalRepository.save(nota);

        config.setNumeroProximaNfe(numeroNfe + 1);
        configuracaoService.atualizarConfiguracao(config);

        return Map.of("message", "NF-e de Peças AUTORIZADA pela SEFAZ!", "chaveAcesso", chaveAcesso);
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

        // 🚧 ===================== FUTURA MANUTENÇÃO: API DE PREFEITURA ===================== 🚧
        // No Brasil, Prefeituras NÃO usam um padrão nacional como a SEFAZ. É impossível manter isso na mão.
        // O ideal é você contratar uma API (Ex: Focus NFe, Tecnospeed, eNotas, Webmania).
        // Quando você assinar uma API, APAGUE o bloco de `StringBuilder xml...` abaixo, e use o exemplo JSON comentado:

        /* // 💡 EXEMPLO DE COMO FICARÁ O CÓDIGO QUANDO VOCÊ USAR UMA API (Focus NFe):

        java.util.Map<String, Object> dadosNota = new java.util.HashMap<>();
        dadosNota.put("data_emissao", LocalDateTime.now().toString());
        dadosNota.put("prestador_cnpj", config.getCnpj().replaceAll("\\D", ""));
        dadosNota.put("prestador_inscricao_municipal", config.getInscricaoMunicipal());
        dadosNota.put("tomador_cnpj", os.getCliente().getDocumento().replaceAll("\\D", ""));
        dadosNota.put("tomador_razao_social", os.getCliente().getNome());
        dadosNota.put("servico_valor", os.getTotalServicos());
        dadosNota.put("servico_codigo", config.getCodigoServicoLc116());

        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Basic SEU_TOKEN_DA_API_AQUI");

        org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(dadosNota, headers);
        org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity("https://api.focusnfe.com.br/v2/nfse", request, java.util.Map.class);

        String linkPdf = (String) response.getBody().get("caminho_pdf");
        return Map.of("message", "NFS-e gerada!", "linkPdf", linkPdf);
        */

        // ======================= XML ABRASF ATUAL (APENAS PARA MOCK/TESTE) =======================
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<EnviarLoteRpsEnvio xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n");
        xml.append("  <LoteRps>\n    <Rps>\n      <InfDeclaracaoPrestacaoServico>\n");

        // Identificação do Recibo Provisório de Serviço (RPS)
        xml.append("        <Rps>\n          <IdentificacaoRps><Numero>").append(numeroRps).append("</Numero><Serie>UN</Serie><Tipo>1</Tipo></IdentificacaoRps>\n        </Rps>\n");

        // Informações da Mão de Obra
        xml.append("        <Servico>\n");
        xml.append("          <Valores><ValorServicos>").append(os.getTotalServicos()).append("</ValorServicos></Valores>\n");
        xml.append("          <ItemListaServico>").append(config.getCodigoServicoLc116()).append("</ItemListaServico>\n");
        xml.append("          <CodigoCnae>").append(config.getCodigoCnae().replaceAll("\\D", "")).append("</CodigoCnae>\n");
        xml.append("          <Discriminacao>Serviços de Manutenção Automotiva ref. a OS ").append(os.getId()).append("</Discriminacao>\n");
        xml.append("          <CodigoMunicipio>").append(config.getCodigoIbgeMunicipio()).append("</CodigoMunicipio>\n");
        xml.append("        </Servico>\n");

        // Informações da Oficina
        xml.append("        <Prestador>\n");
        xml.append("          <CpfCnpj><Cnpj>").append(config.getCnpj().replaceAll("\\D", "")).append("</Cnpj></CpfCnpj>\n");
        xml.append("          <InscricaoMunicipal>").append(config.getInscricaoMunicipal()).append("</InscricaoMunicipal>\n");
        xml.append("        </Prestador>\n");

        xml.append("      </InfDeclaracaoPrestacaoServico>\n    </Rps>\n  </LoteRps>\n");
        xml.append("</EnviarLoteRpsEnvio>");
        // ========================================================================================
        // 🚧 ==================================================================================== 🚧

        salvarArquivoXml("NFSE_RPS_" + numeroRps, xml.toString());

        return Map.of("message", "NFS-e gerada e pronta para envio pelo provedor: " + config.getProvedorPrefeitura());
    }

    // ==============================================================
    // 🛠️ MÉTODOS AUXILIARES
    // ==============================================================

    /**
     * Gera uma chave de acesso com 44 dígitos padrão SEFAZ.
     */
    private String gerarChaveAcesso(String modelo, ConfiguracaoSistema config) {
        // 💡 FUTURA MANUTENÇÃO: Para ficar 100% dinâmico, troque o "26" abaixo por:
        // config.getCodigoIbgeMunicipio().substring(0, 2); (Isso pega o Estado real da Empresa)
        String codUf = "26";

        String data = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMM"));

        String cnpj = config.getCnpj().replaceAll("\\D", "");
        if (cnpj.length() < 14) cnpj = String.format("%14s", cnpj).replace(' ', '0');

        String serie = String.format("%03d", config.getSerieNfe());
        String numero = String.format("%09d", config.getNumeroProximaNfe());
        String numAleatorio = String.format("%08d", new Random().nextInt(99999999));

        // 💡 FUTURA MANUTENÇÃO: O último dígito é o "DV" (Dígito Verificador).
        // No NfeService.java já tem a função calcularDV(). É só jogar o método pra cá no futuro!
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