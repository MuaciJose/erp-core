package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DanfeService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    // =======================================================================
    // 🚀 MOTOR DE DANFE PARA NOTAS DO PDV (BALCÃO)
    // =======================================================================
    public byte[] gerarDanfePdf(NotaFiscal nota) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        ClassPathResource resource = new ClassPathResource("reports/danfe.jrxml");

        if (!resource.exists()) {
            throw new Exception("O Spring Boot não encontrou o arquivo na pasta compilada. Rode 'mvn clean install'.");
        }

        InputStream reportStream = resource.getInputStream();
        Map<String, Object> parametros = new HashMap<>();

        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial() != null ? config.getRazaoSocial() : "NOME DA LOJA NÃO CONFIGURADO");
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("EMITENTE_CIDADE_UF", config.getCidade() + "/" + config.getUf());

        if (config.getLogoBase64() != null && config.getLogoBase64().contains(",")) {
            String base64Image = config.getLogoBase64().split(",")[1];
            parametros.put("LOGO", new ByteArrayInputStream(Base64.getDecoder().decode(base64Image)));
        }

        String nomeCliente = "CONSUMIDOR FINAL";
        String docCliente = "NÃO INFORMADO";
        if (nota.getVenda() != null && nota.getVenda().getCliente() != null) {
            if (nota.getVenda().getCliente().getNome() != null) nomeCliente = nota.getVenda().getCliente().getNome();
            if (nota.getVenda().getCliente().getDocumento() != null) docCliente = nota.getVenda().getCliente().getDocumento();
        }
        parametros.put("CLIENTE_NOME", nomeCliente);
        parametros.put("CLIENTE_DOC", docCliente);

        parametros.put("CHAVE_ACESSO", nota.getChaveAcesso());
        parametros.put("NUMERO_NOTA", nota.getNumero() != null ? String.valueOf(nota.getNumero()) : "S/N");
        parametros.put("PROTOCOLO", nota.getProtocolo());
        parametros.put("VENDEDOR", nota.getVenda() != null ? nota.getVenda().getVendedorNome() : "Sistema");
        parametros.put("VALOR_TOTAL", nota.getVenda() != null ? nota.getVenda().getValorTotal() : 0.0);

        String dataFormatada = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date.from(nota.getDataEmissao().atZone(java.time.ZoneId.systemDefault()).toInstant()));
        parametros.put("DATA_EMISSAO", dataFormatada);
        parametros.put("INF_COMPLEMENTARES", "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.");

        List<ItemVenda> itens = nota.getVenda() != null ? nota.getVenda().getItens() : List.of();
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(itens);

        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    // =======================================================================
    // 🚀 MOTOR DE DANFE AVULSA (LÊ O XML USANDO PARSER NATIVO DO JAVA)
    // =======================================================================
    public byte[] gerarDanfeAvulsaPdf(NotaFiscal nota) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String chave = nota.getChaveAcesso();
        String caminhoXml = System.getProperty("user.dir") + "/nfe_xmls/" + chave + ".xml";

        File arquivoXml = new File(caminhoXml);
        if (!arquivoXml.exists()) {
            throw new Exception("Arquivo XML não encontrado no caminho: " + caminhoXml);
        }

        // 1. O PARSER OFICIAL DO JAVA (Não quebra com pular de linhas e não deixa nulo!)
        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
        Document doc = dBuilder.parse(arquivoXml);
        doc.getDocumentElement().normalize();

        Map<String, Object> parametros = new HashMap<>();
        parametros.put("CHAVE_ACESSO", chave);
        parametros.put("NUMERO_NOTA", String.valueOf(nota.getNumero()));
        parametros.put("DATA_EMISSAO", new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new java.util.Date()));

        // 2. PEGANDO O DESTINATÁRIO (CLIENTE) DIRETO DO NODE XML
        NodeList destNodes = doc.getElementsByTagName("dest");
        if (destNodes.getLength() > 0) {
            Element destElement = (Element) destNodes.item(0);

            if (destElement.getElementsByTagName("xNome").getLength() > 0) {
                parametros.put("CLIENTE_NOME", destElement.getElementsByTagName("xNome").item(0).getTextContent());
            }
            if (destElement.getElementsByTagName("CNPJ").getLength() > 0) {
                parametros.put("CLIENTE_DOC", destElement.getElementsByTagName("CNPJ").item(0).getTextContent());
            } else if (destElement.getElementsByTagName("CPF").getLength() > 0) {
                parametros.put("CLIENTE_DOC", destElement.getElementsByTagName("CPF").item(0).getTextContent());
            }
        }

        // 3. PEGANDO O TOTAL DA NOTA
        NodeList totalNodes = doc.getElementsByTagName("vNF");
        if (totalNodes.getLength() > 0) {
            parametros.put("VALOR_TOTAL", Double.parseDouble(totalNodes.item(0).getTextContent()));
        }

        // Configurações do Emitente Reais
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial() != null ? config.getRazaoSocial() : "NOME DA LOJA NÃO CONFIGURADO");
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("INF_COMPLEMENTARES", "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.");

        // 4. LENDO TODOS OS PRODUTOS DA NOTA
        List<Map<String, Object>> itensList = new ArrayList<>();
        NodeList detNodes = doc.getElementsByTagName("det");

        for (int i = 0; i < detNodes.getLength(); i++) {
            Element detElement = (Element) detNodes.item(i);
            Element prodElement = (Element) detElement.getElementsByTagName("prod").item(0);

            Map<String, Object> map = new HashMap<>();

            // As chaves do mapa devem bater com os $F{...} do seu Jasper!
            map.put("produto.sku", prodElement.getElementsByTagName("cProd").item(0).getTextContent());
            map.put("produto.nome", prodElement.getElementsByTagName("xProd").item(0).getTextContent());
            map.put("quantidade", Double.parseDouble(prodElement.getElementsByTagName("qCom").item(0).getTextContent()));
            map.put("precoUnitario", Double.parseDouble(prodElement.getElementsByTagName("vUnCom").item(0).getTextContent()));

            if (prodElement.getElementsByTagName("CFOP").getLength() > 0) {
                map.put("produto.cfopPadrao", prodElement.getElementsByTagName("CFOP").item(0).getTextContent());
            }

            itensList.add(map);
        }

        // Cast forçado para o Jasper não reclamar
        net.sf.jasperreports.engine.data.JRMapCollectionDataSource dataSource =
                new net.sf.jasperreports.engine.data.JRMapCollectionDataSource((java.util.Collection) itensList);

        ClassPathResource resource = new ClassPathResource("reports/danfe.jrxml");
        if (!resource.exists()) {
            throw new Exception("O Spring Boot não encontrou o arquivo danfe.jrxml na pasta resources/reports.");
        }
        InputStream jrxmlInput = resource.getInputStream();

        JasperReport relatorio = JasperCompileManager.compileReport(jrxmlInput);
        JasperPrint impressao = JasperFillManager.fillReport(relatorio, parametros, dataSource);

        return JasperExportManager.exportReportToPdf(impressao);
    }
}