package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource; // 🚀 Ferramenta nativa do Spring
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
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
            throw new Exception("O Spring Boot não encontrou o arquivo na pasta compilada. Pare o servidor e rode o comando 'mvn clean install' para forçar a cópia do arquivo!");
        }

        InputStream reportStream = resource.getInputStream();
        Map<String, Object> parametros = new HashMap<>();

        // Dados do Emitente
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial() != null ? config.getRazaoSocial() : "NOME DA LOJA NÃO CONFIGURADO");
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("EMITENTE_CIDADE_UF", config.getCidade() + "/" + config.getUf());

        // Lógica da Logo
        if (config.getLogoBase64() != null && config.getLogoBase64().contains(",")) {
            String base64Image = config.getLogoBase64().split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            parametros.put("LOGO", new ByteArrayInputStream(imageBytes));
        }

        // Dados do Cliente
        String nomeCliente = "CONSUMIDOR FINAL";
        String docCliente = "NÃO INFORMADO";
        if (nota.getVenda() != null && nota.getVenda().getCliente() != null) {
            if (nota.getVenda().getCliente().getNome() != null) nomeCliente = nota.getVenda().getCliente().getNome();
            if (nota.getVenda().getCliente().getDocumento() != null) docCliente = nota.getVenda().getCliente().getDocumento();
        }
        parametros.put("CLIENTE_NOME", nomeCliente);
        parametros.put("CLIENTE_DOC", docCliente);

        // Dados da Nota
        parametros.put("CHAVE_ACESSO", nota.getChaveAcesso());
        parametros.put("NUMERO_NOTA", nota.getNumero() != null ? String.valueOf(nota.getNumero()) : "S/N");
        parametros.put("PROTOCOLO", nota.getProtocolo());
        parametros.put("VENDEDOR", nota.getVenda() != null ? nota.getVenda().getVendedorNome() : "Sistema");
        parametros.put("VALOR_TOTAL", nota.getVenda() != null ? nota.getVenda().getValorTotal() : 0.0);

        String dataFormatada = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date.from(nota.getDataEmissao().atZone(java.time.ZoneId.systemDefault()).toInstant()));
        parametros.put("DATA_EMISSAO", dataFormatada);
        parametros.put("INF_COMPLEMENTARES", "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.");

        // Itens
        List<ItemVenda> itens = nota.getVenda() != null ? nota.getVenda().getItens() : List.of();
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(itens);

        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }

    // =======================================================================
    // 🚀 MOTOR EXCLUSIVO DE DANFE PARA NOTAS AVULSAS (LÊ DIRETO DO XML)
    // =======================================================================
    public byte[] gerarDanfeAvulsaPdf(NotaFiscal nota) throws Exception {
        // Pega as configurações reais da empresa
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        String chave = nota.getChaveAcesso();
        String caminhoXml = System.getProperty("user.dir") + "/nfe_xmls/" + chave + ".xml";

        // Lê o XML inteiro do disco
        String xml = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(caminhoXml)), java.nio.charset.StandardCharsets.UTF_8);

        java.util.Map<String, Object> parametros = new java.util.HashMap<>();
        parametros.put("CHAVE_ACESSO", chave);
        parametros.put("NUMERO_NOTA", String.valueOf(nota.getNumero()));
        parametros.put("DATA_EMISSAO", new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new java.util.Date()));

        // Pesca os dados do cliente de dentro do XML
        java.util.regex.Matcher mNome = java.util.regex.Pattern.compile("<dest>.*?<xNome>(.*?)</xNome>").matcher(xml);
        if(mNome.find()) parametros.put("CLIENTE_NOME", mNome.group(1));

        java.util.regex.Matcher mDoc = java.util.regex.Pattern.compile("<dest>.*?(?:<CNPJ>|<CPF>)(.*?)(?:</CNPJ>|</CPF>)").matcher(xml);
        if(mDoc.find()) parametros.put("CLIENTE_DOC", mDoc.group(1));

        java.util.regex.Matcher mTotal = java.util.regex.Pattern.compile("<vNF>(.*?)</vNF>").matcher(xml);
        if(mTotal.find()) parametros.put("VALOR_TOTAL", Double.parseDouble(mTotal.group(1)));

        // Configurações do Emitente Reais
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial() != null ? config.getRazaoSocial() : "NOME DA LOJA NÃO CONFIGURADO");
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("INF_COMPLEMENTARES", "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.");

        // Adiciona um item genérico de fechamento para preencher a tabela
        java.util.List<java.util.Map<String, Object>> itens = new java.util.ArrayList<>();
        java.util.Map<String, Object> itemUnico = new java.util.HashMap<>();
        itemUnico.put("produto.sku", "000");
        itemUnico.put("produto.nome", "MERCADORIAS CONFORME ARQUIVO XML");
        itemUnico.put("quantidade", 1.0);
        itemUnico.put("precoUnitario", parametros.get("VALOR_TOTAL") != null ? parametros.get("VALOR_TOTAL") : 0.0);
        itemUnico.put("produto.cfopPadrao", "5102");
        itens.add(itemUnico);

        // 🚀 CORREÇÃO DO ERRO DO COMPILADOR: Cast forçado para java.util.Collection
        net.sf.jasperreports.engine.data.JRMapCollectionDataSource dataSource =
                new net.sf.jasperreports.engine.data.JRMapCollectionDataSource((java.util.Collection) itens);

        // 🚀 LENDO O ARQUIVO DE FORMA PADRONIZADA IGUAL AO PRIMEIRO MÉTODO
        ClassPathResource resource = new ClassPathResource("reports/danfe.jrxml");
        if (!resource.exists()) {
            throw new Exception("O Spring Boot não encontrou o arquivo danfe.jrxml na pasta resources/reports.");
        }
        InputStream jrxmlInput = resource.getInputStream();

        // Compila e Gera o PDF
        net.sf.jasperreports.engine.JasperReport relatorio = net.sf.jasperreports.engine.JasperCompileManager.compileReport(jrxmlInput);
        net.sf.jasperreports.engine.JasperPrint impressao = net.sf.jasperreports.engine.JasperFillManager.fillReport(relatorio, parametros, dataSource);

        return net.sf.jasperreports.engine.JasperExportManager.exportReportToPdf(impressao);
    }
}