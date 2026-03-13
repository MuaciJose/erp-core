package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class DanfeService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    public byte[] gerarDanfePdf(NotaFiscal nota) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 🚀 FORÇANDO A LOGICA: Se tiver venda atrelada ou for modelo 65, USA O CUPOM
        boolean isCupomFiscal = (nota.getVenda() != null) ||
                (nota.getChaveAcesso() != null && nota.getChaveAcesso().contains("65"));

        String nomeArquivoReport = isCupomFiscal ? "reports/cupom_pdv_nfce.jrxml" : "reports/danfe.jrxml";
        ClassPathResource resource = new ClassPathResource(nomeArquivoReport);

        if (!resource.exists()) {
            throw new Exception("Relatório não encontrado: " + nomeArquivoReport);
        }

        InputStream reportStream = resource.getInputStream();
        Map<String, Object> parametros = new HashMap<>();
        JRDataSource dataSource;

        if (isCupomFiscal) {
            parametros.put("empresa", config.getRazaoSocial());
            parametros.put("cnpj", config.getCnpj());
            parametros.put("endereco", config.getLogradouro() + ", " + config.getNumero());
            parametros.put("cidade", config.getCidade() + " - " + config.getUf());
            parametros.put("numeroNota", String.valueOf(nota.getNumero()));
            parametros.put("serie", "1");
            parametros.put("dataHora", new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));

            String doc = (nota.getVenda() != null && nota.getVenda().getCliente() != null) ? nota.getVenda().getCliente().getDocumento() : "";
            parametros.put("cpfCliente", doc);

            BigDecimal total = (nota.getVenda() != null && nota.getVenda().getValorTotal() != null) ? nota.getVenda().getValorTotal() : BigDecimal.ZERO;
            parametros.put("subtotal", (nota.getVenda() != null && nota.getVenda().getValorSubtotal() != null) ? nota.getVenda().getValorSubtotal() : total);
            parametros.put("desconto", (nota.getVenda() != null && nota.getVenda().getDesconto() != null) ? nota.getVenda().getDesconto() : BigDecimal.ZERO);
            parametros.put("totalVenda", total);
            parametros.put("formaPagamento", "DINHEIRO");
            parametros.put("valorPago", total);
            parametros.put("troco", BigDecimal.ZERO);
            parametros.put("valorTributos", total.multiply(new BigDecimal("0.18")));
            parametros.put("fonteTributos", "IBPT");
            parametros.put("chave", nota.getChaveAcesso());
            parametros.put("qrCode", "https://nfce.sefaz." + config.getUf().toLowerCase() + ".gov.br/nfce/consulta?p=" + nota.getChaveAcesso() + "|2|1|1|HASH");

            List<Map<String, ?>> itensMap = new ArrayList<>();
            if (nota.getVenda() != null && nota.getVenda().getItens() != null) {
                for (ItemVenda it : nota.getVenda().getItens()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("sku", it.getProduto().getSku());
                    m.put("produto", it.getProduto().getNome());
                    BigDecimal q = it.getQuantidade() != null ? new BigDecimal(it.getQuantidade()) : BigDecimal.ZERO;
                    BigDecimal p = it.getPrecoUnitario() != null ? it.getPrecoUnitario() : BigDecimal.ZERO;
                    m.put("quantidade", q);
                    m.put("precoUnitario", p);
                    m.put("totalItem", q.multiply(p));
                    itensMap.add(m);
                }
            }
            dataSource = new JRMapCollectionDataSource(itensMap);
        } else {
            // =======================================================================
            // 📑 LAYOUT A4 (NF-e Modelo 55) - Preenchendo seu JRXML completo
            // =======================================================================
            parametros.put("EMITENTE_RAZAO", config.getRazaoSocial());
            parametros.put("EMITENTE_CNPJ", config.getCnpj());
            parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
            parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro() + " - " + config.getCidade() + "/" + config.getUf());

            parametros.put("CHAVE_ACESSO", nota.getChaveAcesso());
            parametros.put("NUMERO_NOTA", String.valueOf(nota.getNumero()));
            parametros.put("DATA_EMISSAO", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));

            // Dados do Cliente (pegando da Venda)
            if (nota.getVenda() != null && nota.getVenda().getCliente() != null) {
                parametros.put("CLIENTE_NOME", nota.getVenda().getCliente().getNome());
                parametros.put("CLIENTE_DOC", nota.getVenda().getCliente().getDocumento());
            }

            // Totais
            BigDecimal totalVenda = (nota.getVenda() != null) ? nota.getVenda().getValorTotal() : BigDecimal.ZERO;
            parametros.put("VALOR_TOTAL", totalVenda);

            parametros.put("INF_COMPLEMENTARES", "Documento autorizado por meio do protocolo oficial da SEFAZ.");

            // O DataSource para os itens (SKU, Nome, Qtd, Preço)
            dataSource = new JRBeanCollectionDataSource(nota.getVenda() != null ? nota.getVenda().getItens() : List.of());
        }

        JasperReport jr = JasperCompileManager.compileReport(reportStream);
        return JasperExportManager.exportReportToPdf(JasperFillManager.fillReport(jr, parametros, dataSource));
    }

    public byte[] gerarDanfeAvulsaPdf(NotaFiscal nota) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String path = System.getProperty("user.dir") + "/nfe_xmls/" + nota.getChaveAcesso() + ".xml";
        File f = new File(path);
        if (!f.exists()) throw new Exception("XML não encontrado.");

        Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(f);
        doc.getDocumentElement().normalize();

        Map<String, Object> p = new HashMap<>();
        p.put("EMITENTE_RAZAO", config.getRazaoSocial());
        p.put("EMITENTE_CNPJ", config.getCnpj());
        p.put("CHAVE_ACESSO", nota.getChaveAcesso());
        p.put("NUMERO_NOTA", String.valueOf(nota.getNumero()));
        p.put("DATA_EMISSAO", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));

        List<Map<String, ?>> itList = new ArrayList<>();
        NodeList nl = doc.getElementsByTagName("det");
        for (int i = 0; i < nl.getLength(); i++) {
            Element el = (Element) nl.item(i);
            Element prod = (Element) el.getElementsByTagName("prod").item(0);
            Map<String, Object> m = new HashMap<>();
            m.put("produto.sku", prod.getElementsByTagName("cProd").item(0).getTextContent());
            m.put("produto.nome", prod.getElementsByTagName("xProd").item(0).getTextContent());
            m.put("quantidade", new BigDecimal(prod.getElementsByTagName("qCom").item(0).getTextContent()));
            m.put("precoUnitario", new BigDecimal(prod.getElementsByTagName("vUnCom").item(0).getTextContent()));
            itList.add(m);
        }

        JasperReport jr = JasperCompileManager.compileReport(new ClassPathResource("reports/danfe.jrxml").getInputStream());
        return JasperExportManager.exportReportToPdf(JasperFillManager.fillReport(jr, p, new JRMapCollectionDataSource(itList)));
    }
}