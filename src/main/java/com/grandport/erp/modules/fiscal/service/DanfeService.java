package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.model.Venda;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import lombok.extern.slf4j.Slf4j;
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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Slf4j
public class DanfeService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private DanfeTemplateService danfeTemplateService;

    private final ConcurrentMap<String, JasperReport> reportCache = new ConcurrentHashMap<>();

    public byte[] gerarDanfePdf(NotaFiscal nota) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 🚀 FORÇANDO A LOGICA: Se tiver venda atrelada ou for modelo 65, USA O CUPOM
        boolean isCupomFiscal = (nota.getVenda() != null) ||
                (nota.getChaveAcesso() != null && nota.getChaveAcesso().contains("65"));

        String nomeArquivoReport = isCupomFiscal ? "reports/cupom_pdv_nfce.jrxml" : "reports/danfe.jrxml";
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

            if (nota.getVenda() != null && nota.getVenda().getCliente() != null) {
                parametros.put("CLIENTE_NOME", nota.getVenda().getCliente().getNome());
                parametros.put("CLIENTE_DOC", nota.getVenda().getCliente().getDocumento());
            }

            BigDecimal totalVenda = (nota.getVenda() != null) ? nota.getVenda().getValorTotal() : BigDecimal.ZERO;
            parametros.put("VALOR_TOTAL", totalVenda);

            parametros.put("INF_COMPLEMENTARES", "Documento autorizado por meio do protocolo oficial da SEFAZ.");

            dataSource = new JRBeanCollectionDataSource(nota.getVenda() != null ? nota.getVenda().getItens() : List.of());
        }

        JasperReport jr = isCupomFiscal
                ? resolveClasspathReport(nomeArquivoReport)
                : resolveDanfeReport();
        byte[] relatorioFinal = JasperExportManager.exportReportToPdf(JasperFillManager.fillReport(jr, parametros, dataSource));

        // 🚀 3. AUDITORIA: Registro da impressão/geração do documento
        String tipoDoc = isCupomFiscal ? "NFC-e (Cupom)" : "NF-e (A4)";
        auditoriaService.registrar("FISCAL", "IMPRESSAO_DANFE", "Gerou o PDF da " + tipoDoc + " número " + nota.getNumero() + ". Chave: " + nota.getChaveAcesso());

        return relatorioFinal;
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

        JasperReport jr = resolveDanfeReport();
        byte[] relatorioFinal = JasperExportManager.exportReportToPdf(JasperFillManager.fillReport(jr, p, new JRMapCollectionDataSource(itList)));

        // 🚀 4. AUDITORIA: Registro da impressão avulsa via XML
        auditoriaService.registrar("FISCAL", "IMPRESSAO_DANFE_AVULSA", "Gerou PDF da DANFE avulsa lendo diretamente do XML. Nota: " + nota.getNumero() + " | Chave: " + nota.getChaveAcesso());

        return relatorioFinal;
    }

    public byte[] gerarPreviewDanfePdf(String jrxml) throws Exception {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial());
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getCidade() + "/" + config.getUf());
        parametros.put("CHAVE_ACESSO", "12345678901234567890123456789012345678901234");
        parametros.put("NUMERO_NOTA", "9001");
        parametros.put("CLIENTE_NOME", "Cliente Preview DANFE");
        parametros.put("CLIENTE_DOC", "123.456.789-00");
        parametros.put("VALOR_TOTAL", new BigDecimal("1580.00"));
        parametros.put("DATA_EMISSAO", new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date()));
        parametros.put("INF_COMPLEMENTARES", "Preview interno do template DANFE.");

        List<ItemVenda> itens = buildPreviewItems();
        JasperReport report = compileTransientReport(jrxml);
        return JasperExportManager.exportReportToPdf(
                JasperFillManager.fillReport(report, parametros, new JRBeanCollectionDataSource(itens))
        );
    }

    private JasperReport resolveDanfeReport() throws JRException {
        String jrxml = danfeTemplateService.obterTemplateCompilavel();
        String cacheKey = "custom-danfe:" + Integer.toHexString(jrxml.hashCode());
        JasperReport cached = reportCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        JasperReport compiled = compileTransientReport(jrxml);
        reportCache.putIfAbsent(cacheKey, compiled);
        return reportCache.get(cacheKey);
    }

    private JasperReport resolveClasspathReport(String reportPath) throws Exception {
        ClassPathResource resource = new ClassPathResource(reportPath);
        if (!resource.exists()) {
            throw new Exception("Relatório não encontrado: " + reportPath);
        }
        return resolveReport(reportPath, resource.getInputStream());
    }

    private JasperReport compileTransientReport(String jrxml) throws JRException {
        return JasperCompileManager.compileReport(new java.io.ByteArrayInputStream(jrxml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    private JasperReport resolveReport(String reportPath, InputStream reportStream) throws JRException {
        JasperReport cached = reportCache.get(reportPath);
        if (cached != null) {
            return cached;
        }
        JasperReport compiled = JasperCompileManager.compileReport(reportStream);
        reportCache.putIfAbsent(reportPath, compiled);
        return reportCache.get(reportPath);
    }

    private List<ItemVenda> buildPreviewItems() {
        Venda venda = new Venda();

        Produto filtro = new Produto();
        filtro.setSku("FILTRO-001");
        filtro.setNome("Filtro de óleo premium");
        filtro.setCfopPadrao("5102");

        Produto pastilha = new Produto();
        pastilha.setSku("PAST-204");
        pastilha.setNome("Pastilha de freio dianteira");
        pastilha.setCfopPadrao("5102");

        ItemVenda item1 = new ItemVenda();
        item1.setVenda(venda);
        item1.setProduto(filtro);
        item1.setQuantidade(2);
        item1.setPrecoUnitario(new BigDecimal("45.00"));

        ItemVenda item2 = new ItemVenda();
        item2.setVenda(venda);
        item2.setProduto(pastilha);
        item2.setQuantidade(1);
        item2.setPrecoUnitario(new BigDecimal("1490.00"));

        Parceiro cliente = new Parceiro();
        cliente.setNome("Cliente Preview DANFE");
        cliente.setDocumento("123.456.789-00");
        venda.setCliente(cliente);

        return List.of(item1, item2);
    }
}
