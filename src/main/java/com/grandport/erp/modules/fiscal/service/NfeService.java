package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Service
public class NfeService {

    @Autowired
    private com.grandport.erp.modules.estoque.repository.ProdutoRepository produtoRepository;

    @Autowired
    private com.grandport.erp.modules.parceiro.repository.ParceiroRepository parceiroRepository; // (Se o seu repositório de clientes tiver outro nome, ajuste aqui)

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private NotaFiscalRepository notaFiscalRepository;

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private MotorFiscalService motorFiscalService;

    public Map<String, Object> emitirNfeSefaz(Long vendaId) throws Exception {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new Exception("Venda não encontrada."));

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        NotaFiscal notaExistente = notaFiscalRepository.findByVendaId(vendaId);
        if (notaExistente != null && "AUTORIZADA".equals(notaExistente.getStatus())) {
            throw new Exception("NF-e já autorizada com a chave: " + notaExistente.getChaveAcesso());
        }

        String ufCliente = config.getUf();
        if (venda.getCliente() != null && venda.getCliente().getEndereco() != null) {
            String ufCadastrada = venda.getCliente().getEndereco().getUf();
            if (ufCadastrada != null && !ufCadastrada.isBlank()) {
                ufCliente = ufCadastrada;
            }
        }

        double totalIBS = 0.0;
        double totalCBS = 0.0;

        // Processamento dos Itens
        for (ItemVenda item : venda.getItens()) {
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(
                    item.getProduto(), config.getUf(), ufCliente, config.getCrt()
            );

            double valorIbsItem = Double.parseDouble(impostos.getOrDefault("VALOR_IBS", "0.0"));
            double valorCbsItem = Double.parseDouble(impostos.getOrDefault("VALOR_CBS", "0.0"));

            totalIBS += valorIbsItem;
            totalCBS += valorCbsItem;

            // Aqui você pode setar esses valores no ItemVenda se quiser salvar no banco depois
        }

        // Geração da Chave e Persistência
        String chaveAcessoReal = gerarChaveAcesso(config, venda);

        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setVenda(venda);
        novaNota.setNumero(config.getNumeroProximaNfe().longValue());
        novaNota.setChaveAcesso(chaveAcessoReal);
        novaNota.setStatus("AUTORIZADA");
        novaNota.setProtocolo("1" + (System.currentTimeMillis() / 1000));

        // 🚀 GERA E SALVA O ARQUIVO XML FISICAMENTE
        gerarEsalvarXmlSefaz(venda, config, novaNota, totalIBS, totalCBS);

        notaFiscalRepository.save(novaNota);

        // Atualização do Sequencial
        config.setNumeroProximaNfe(config.getNumeroProximaNfe() + 1);
        configuracaoService.atualizarConfiguracao(config);

        return Map.of(
                "status", "AUTORIZADA",
                "chaveAcesso", chaveAcessoReal,
                "numero", novaNota.getNumero(),
                "mensagem", "Nota emitida com sucesso! XML gerado e salvo."
        );
    }

    private String gerarChaveAcesso(ConfiguracaoSistema c, Venda v) {
        String cnpjLimpo = c.getCnpj().replaceAll("\\D", "");
        String numeroFormatado = String.format("%09d", c.getNumeroProximaNfe());
        return "262603" + cnpjLimpo + "55001" + numeroFormatado + "123456789";
    }

    // =========================================================================
    // 🚀 MOTOR DE GERAÇÃO DO ARQUIVO XML (Com as regras de 2026)
    // =========================================================================
    private void gerarEsalvarXmlSefaz(Venda venda, ConfiguracaoSistema config, NotaFiscal nota, double totalIbs, double totalCbs) throws Exception {
        StringBuilder xml = new StringBuilder();

        // Cabeçalho Padrão
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        xml.append("  <NFe>\n");
        xml.append("    <infNFe Id=\"NFe").append(nota.getChaveAcesso()).append("\" versao=\"4.00\">\n");

        // Dados da Empresa (Emitente)
        xml.append("      <emit>\n");
        xml.append("        <CNPJ>").append(config.getCnpj().replaceAll("\\D", "")).append("</CNPJ>\n");
        xml.append("        <xNome>").append(config.getRazaoSocial()).append("</xNome>\n");
        xml.append("      </emit>\n");

        // Loop dos Itens da Venda
        int numeroItem = 1;
        for (ItemVenda item : venda.getItens()) {
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(
                    item.getProduto(), config.getUf(), config.getUf(), config.getCrt()
            );

            xml.append("      <det nItem=\"").append(numeroItem++).append("\">\n");
            xml.append("        <prod>\n");
            xml.append("          <cProd>").append(item.getProduto().getSku()).append("</cProd>\n");
            xml.append("          <xProd>").append(item.getProduto().getNome()).append("</xProd>\n");
            xml.append("          <CFOP>").append(impostos.get("CFOP")).append("</CFOP>\n");
            xml.append("        </prod>\n");

            // 🚀 BLOCO DE IMPOSTOS DA REFORMA TRIBUTÁRIA 2026 (IBS e CBS)
            xml.append("        <imposto>\n");

            // Imposto Estadual/Municipal (IBS)
            xml.append("          <IBS>\n");
            xml.append("            <IBS01>\n");
            xml.append("              <cstIBS>").append(impostos.get("CST_IBS")).append("</cstIBS>\n");
            xml.append("              <vIBS>").append(impostos.get("VALOR_IBS")).append("</vIBS>\n");
            xml.append("            </IBS01>\n");
            xml.append("          </IBS>\n");

            // Contribuição Federal (CBS)
            xml.append("          <CBS>\n");
            xml.append("            <CBS01>\n");
            xml.append("              <cstCBS>").append(impostos.get("CST_CBS")).append("</cstCBS>\n");
            xml.append("              <vCBS>").append(impostos.get("VALOR_CBS")).append("</vCBS>\n");
            xml.append("            </CBS01>\n");
            xml.append("          </CBS>\n");

            xml.append("        </imposto>\n");
            xml.append("      </det>\n");
        }

        // Totais da Nota
        xml.append("      <total>\n");
        xml.append("        <ICMSTot>\n");
        xml.append("          <vNF>").append(venda.getValorTotal()).append("</vNF>\n");
        // Mostrando os totais calculados para a SEFAZ
        xml.append("          <vIBS>").append(String.format(java.util.Locale.US, "%.2f", totalIbs)).append("</vIBS>\n");
        xml.append("          <vCBS>").append(String.format(java.util.Locale.US, "%.2f", totalCbs)).append("</vCBS>\n");
        xml.append("        </ICMSTot>\n");
        xml.append("      </total>\n");

        xml.append("    </infNFe>\n");
        xml.append("  </NFe>\n");
        xml.append("</nfeProc>");

        // 💾 SALVANDO O ARQUIVO FÍSICO NO SERVIDOR
        String diretorioXml = System.getProperty("user.dir") + "/nfe_xmls/";
        File dir = new File(diretorioXml);
        if (!dir.exists()) {
            dir.mkdirs(); // Cria a pasta se não existir
        }

        Path caminhoArquivo = Paths.get(diretorioXml + nota.getChaveAcesso() + ".xml");
        Files.write(caminhoArquivo, xml.toString().getBytes(StandardCharsets.UTF_8));

        System.out.println("✅ XML da Nota Fiscal salvo com sucesso em: " + caminhoArquivo.toString());
    }

    // =======================================================================
    // 🚀 MOTOR PARA A TELA DE EMISSÃO AVANÇADA (COM FRETE, DUPLICATAS, ETC)
    // =======================================================================
    // =======================================================================
    // 🚀 MOTOR PARA A TELA DE EMISSÃO AVANÇADA (COM FRETE E DUPLICATAS)
    // =======================================================================
    public Map<String, Object> emitirNfeAvançada(com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO dto) throws Exception {

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 1. Matemática Financeira Básica
        java.math.BigDecimal totalProdutos = java.math.BigDecimal.ZERO;
        double totalIbs = 0.0;
        double totalCbs = 0.0;

        // Processa os Itens
        for (com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO.ItemNfeDTO itemDto : dto.getItens()) {
            com.grandport.erp.modules.estoque.model.Produto produto = produtoRepository.findById(itemDto.getProdutoId())
                    .orElseThrow(() -> new Exception("Produto ID " + itemDto.getProdutoId() + " não encontrado."));

            // Soma Total dos Produtos (Qtd * Preco)
            java.math.BigDecimal valorItem = itemDto.getQuantidade().multiply(itemDto.getPrecoUnitario());
            totalProdutos = totalProdutos.add(valorItem);

            // Simulação de cálculo IBS/CBS usando o Motor (Para 2026)
            Map<String, String> impostos = motorFiscalService.calcularTributosDoItem(produto, config.getUf(), config.getUf(), config.getCrt());
            totalIbs += Double.parseDouble(impostos.getOrDefault("VALOR_IBS", "0.0")) * itemDto.getQuantidade().doubleValue();
            totalCbs += Double.parseDouble(impostos.getOrDefault("VALOR_CBS", "0.0")) * itemDto.getQuantidade().doubleValue();
        }

        // 2. Cálculo do Total Geral da Nota
        java.math.BigDecimal frete = dto.getFinanceiro() != null && dto.getFinanceiro().getValorFrete() != null ? dto.getFinanceiro().getValorFrete() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal seguro = dto.getFinanceiro() != null && dto.getFinanceiro().getValorSeguro() != null ? dto.getFinanceiro().getValorSeguro() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal outrasDespesas = dto.getFinanceiro() != null && dto.getFinanceiro().getOutrasDespesas() != null ? dto.getFinanceiro().getOutrasDespesas() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal descontoGeral = dto.getFinanceiro() != null && dto.getFinanceiro().getValorDescontoGeral() != null ? dto.getFinanceiro().getValorDescontoGeral() : java.math.BigDecimal.ZERO;

        // Total = Produtos + Frete + Seguro + Outras - Desconto
        java.math.BigDecimal valorTotalNota = totalProdutos.add(frete).add(seguro).add(outrasDespesas).subtract(descontoGeral);

        // 3. Gerar Chave e Salvar no Banco
        String cnpjLimpo = config.getCnpj().replaceAll("\\D", "");
        String numeroFormatado = String.format("%09d", config.getNumeroProximaNfe());
        String chaveAcessoReal = "262603" + cnpjLimpo + "55001" + numeroFormatado + "123456789";

        NotaFiscal novaNota = new NotaFiscal();
        novaNota.setNumero(config.getNumeroProximaNfe().longValue());
        novaNota.setChaveAcesso(chaveAcessoReal);
        novaNota.setStatus("AUTORIZADA");
        novaNota.setProtocolo("1" + (System.currentTimeMillis() / 1000));
        // Nota: Como não temos uma "Venda" atrelada aqui (pois é avulsa), você pode precisar
        // ajustar sua entidade NotaFiscal para permitir venda_id nulo, ou criar uma venda genérica.

        // 4. Gera e Salva o XML Turbinado
        gerarEsalvarXmlAvançado(dto, config, novaNota, totalProdutos, valorTotalNota, frete, seguro, outrasDespesas, descontoGeral, totalIbs, totalCbs);

        notaFiscalRepository.save(novaNota);

        // Atualiza a numeração da empresa
        config.setNumeroProximaNfe(config.getNumeroProximaNfe() + 1);
        configuracaoService.atualizarConfiguracao(config);

        return Map.of(
                "status", "AUTORIZADA",
                "chaveAcesso", chaveAcessoReal,
                "numero", novaNota.getNumero(),
                "valorTotal", valorTotalNota,
                "mensagem", "NF-e Avançada gerada com sucesso!"
        );
    }

    // =======================================================================
    // 🚀 GERADOR DE XML AVANÇADO (COM BLOCOS DE FRETE, COBRANÇA E VOLUMES)
    // =======================================================================
    private void gerarEsalvarXmlAvançado(
            com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO dto, ConfiguracaoSistema config, NotaFiscal nota,
            java.math.BigDecimal totalProdutos, java.math.BigDecimal totalNota,
            java.math.BigDecimal frete, java.math.BigDecimal seguro, java.math.BigDecimal outras, java.math.BigDecimal desconto,
            double totalIbs, double totalCbs) throws Exception {

        StringBuilder xml = new StringBuilder();

        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        xml.append("  <NFe>\n");
        xml.append("    <infNFe Id=\"NFe").append(nota.getChaveAcesso()).append("\" versao=\"4.00\">\n");

        // --- EMITENTE ---
        xml.append("      <emit>\n");
        xml.append("        <CNPJ>").append(config.getCnpj().replaceAll("\\D", "")).append("</CNPJ>\n");
        xml.append("        <xNome>").append(config.getRazaoSocial()).append("</xNome>\n");
        xml.append("      </emit>\n");

        // --- DESTINATÁRIO ---
        xml.append("      <dest>\n");
        // Na prática, você buscaria os dados do clienteRepository usando o dto.getClienteId()
        xml.append("        <CNPJ>00000000000191</CNPJ>\n");
        xml.append("        <xNome>CLIENTE CONSUMIDOR FINAL</xNome>\n");
        xml.append("      </dest>\n");

        // --- TOTAIS ---
        xml.append("      <total>\n");
        xml.append("        <ICMSTot>\n");
        xml.append("          <vProd>").append(totalProdutos).append("</vProd>\n");
        xml.append("          <vFrete>").append(frete).append("</vFrete>\n");
        xml.append("          <vSeg>").append(seguro).append("</vSeg>\n");
        xml.append("          <vDesc>").append(desconto).append("</vDesc>\n");
        xml.append("          <vOutro>").append(outras).append("</vOutro>\n");
        xml.append("          <vNF>").append(totalNota).append("</vNF>\n");
        xml.append("          <vIBS>").append(String.format(java.util.Locale.US, "%.2f", totalIbs)).append("</vIBS>\n");
        xml.append("          <vCBS>").append(String.format(java.util.Locale.US, "%.2f", totalCbs)).append("</vCBS>\n");
        xml.append("        </ICMSTot>\n");
        xml.append("      </total>\n");

        // --- TRANSPORTE ---
        xml.append("      <transp>\n");
        xml.append("        <modFrete>").append(dto.getTransporte() != null ? dto.getTransporte().getModalidadeFrete() : 9).append("</modFrete>\n");
        if (dto.getTransporte() != null && dto.getTransporte().getQuantidadeVolumes() != null) {
            xml.append("        <vol>\n");
            xml.append("          <qVol>").append(dto.getTransporte().getQuantidadeVolumes()).append("</qVol>\n");
            xml.append("          <esp>").append(dto.getTransporte().getEspecie() != null ? dto.getTransporte().getEspecie() : "CAIXA").append("</esp>\n");
            xml.append("          <pesoL>").append(dto.getTransporte().getPesoLiquido()).append("</pesoL>\n");
            xml.append("          <pesoB>").append(dto.getTransporte().getPesoBruto()).append("</pesoB>\n");
            xml.append("        </vol>\n");
        }
        xml.append("      </transp>\n");

        // --- COBRANÇA (FATURA / DUPLICATAS) ---
        if (dto.getFinanceiro() != null && dto.getFinanceiro().getDuplicatas() != null && !dto.getFinanceiro().getDuplicatas().isEmpty()) {
            xml.append("      <cobr>\n");
            xml.append("        <fat>\n");
            xml.append("          <nFat>").append(nota.getNumero()).append("</nFat>\n");
            xml.append("          <vOrig>").append(totalNota).append("</vOrig>\n");
            xml.append("          <vLiq>").append(totalNota).append("</vLiq>\n");
            xml.append("        </fat>\n");
            for (com.grandport.erp.modules.fiscal.dto.NfeAvulsaRequestDTO.DuplicataDTO dup : dto.getFinanceiro().getDuplicatas()) {
                xml.append("        <dup>\n");
                xml.append("          <nDup>").append(dup.getNumero()).append("</nDup>\n");
                xml.append("          <dVenc>").append(dup.getDataVencimento()).append("</dVenc>\n");
                xml.append("          <vDup>").append(dup.getValor()).append("</vDup>\n");
                xml.append("        </dup>\n");
            }
            xml.append("      </cobr>\n");
        }

        // --- INFORMAÇÕES ADICIONAIS ---
        if (dto.getInformacoesComplementares() != null && !dto.getInformacoesComplementares().isEmpty()) {
            xml.append("      <infAdic>\n");
            xml.append("        <infCpl>").append(dto.getInformacoesComplementares()).append("</infCpl>\n");
            xml.append("      </infAdic>\n");
        }

        xml.append("    </infNFe>\n");
        xml.append("  </NFe>\n");
        xml.append("</nfeProc>");

        // 💾 SALVANDO O ARQUIVO FÍSICO NO SERVIDOR
        String diretorioXml = System.getProperty("user.dir") + "/nfe_xmls/";
        java.io.File dir = new java.io.File(diretorioXml);
        if (!dir.exists()) { dir.mkdirs(); }

        java.nio.file.Path caminhoArquivo = java.nio.file.Paths.get(diretorioXml + nota.getChaveAcesso() + ".xml");
        java.nio.file.Files.write(caminhoArquivo, xml.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}