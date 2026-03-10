package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
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
    private ConfiguracaoService configuracaoService; // 🚀 Para buscar os dados da sua empresa

    public byte[] gerarDanfePdf(NotaFiscal nota) throws Exception {
        // 1. Busca as configurações da GrandPort no banco
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 2. Carrega o layout (Pasta: src/main/resources/reports/danfe.jrxml)
        InputStream reportStream = getClass().getResourceAsStream("/reports/danfe.jrxml");
        if (reportStream == null) {
            throw new Exception("Arquivo danfe.jrxml não encontrado em resources/reports/");
        }

        // 3. Prepara os Parâmetros do Relatório
        Map<String, Object> parametros = new HashMap<>();

        // --- DADOS DO EMITENTE (SUA LOJA) ---
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial());
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("EMITENTE_CIDADE_UF", config.getCidade() + "/" + config.getUf());

        // 🚀 LÓGICA DA LOGO: Converte Base64 para InputStream para o Jasper
        if (config.getLogoBase64() != null && config.getLogoBase64().contains(",")) {
            String base64Image = config.getLogoBase64().split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            parametros.put("LOGO", new ByteArrayInputStream(imageBytes));
        }

        // --- DADOS DO DESTINATÁRIO (CLIENTE) ---
        parametros.put("CLIENTE_NOME", nota.getVenda().getCliente().getNome());
        parametros.put("CLIENTE_DOC", nota.getVenda().getCliente().getDocumento());

        // --- DADOS DA NOTA FISCAL ---
        parametros.put("CHAVE_ACESSO", nota.getChaveAcesso());
        parametros.put("NUMERO_NOTA", nota.getNumero());
        parametros.put("PROTOCOLO", nota.getProtocolo());

        // 🚀 CORREÇÃO DO VENDEDOR (Usando os campos da sua classe Venda)
        parametros.put("VENDEDOR", nota.getVenda().getVendedorNome());
        parametros.put("VALOR_TOTAL", nota.getVenda().getValorTotal());

        // 4. Prepara os itens da venda (corpo da tabela)
        List<ItemVenda> itens = nota.getVenda().getItens();
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(itens);

        // 5. Compila e gera o binário do PDF
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}