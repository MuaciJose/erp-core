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

    public byte[] gerarDanfePdf(NotaFiscal nota) throws Exception {
        // 1. Busca as configurações da GrandPort no banco
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        // 2. 🚀 O JEITO BLINDADO DO SPRING DE LER ARQUIVOS:
        // Ele vai procurar a pasta "reports" dentro do classpath (resources compilado)
        ClassPathResource resource = new ClassPathResource("reports/danfe.jrxml");

        if (!resource.exists()) {
            throw new Exception("O Spring Boot não encontrou o arquivo na pasta compilada. Pare o servidor e rode o comando 'mvn clean install' para forçar a cópia do arquivo!");
        }

        // Abre o fluxo de leitura seguro
        InputStream reportStream = resource.getInputStream();

        // 3. Prepara os Parâmetros do Relatório
        Map<String, Object> parametros = new HashMap<>();

        // --- DADOS DO EMITENTE (SUA LOJA) ---
        parametros.put("EMITENTE_RAZAO", config.getRazaoSocial() != null ? config.getRazaoSocial() : "NOME DA LOJA NÃO CONFIGURADO");
        parametros.put("EMITENTE_CNPJ", config.getCnpj());
        parametros.put("EMITENTE_IE", config.getInscricaoEstadual());
        parametros.put("EMITENTE_ENDERECO", config.getLogradouro() + ", " + config.getNumero() + " - " + config.getBairro());
        parametros.put("EMITENTE_CIDADE_UF", config.getCidade() + "/" + config.getUf());

        // --- LÓGICA DA LOGO ---
        if (config.getLogoBase64() != null && config.getLogoBase64().contains(",")) {
            String base64Image = config.getLogoBase64().split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            parametros.put("LOGO", new ByteArrayInputStream(imageBytes));
        }

        // --- 🚀 BLINDAGEM CONTRA CLIENTE AVULSO (Evita NullPointerException) ---
        String nomeCliente = "CONSUMIDOR FINAL";
        String docCliente = "NÃO INFORMADO";

        if (nota.getVenda() != null && nota.getVenda().getCliente() != null) {
            if (nota.getVenda().getCliente().getNome() != null) nomeCliente = nota.getVenda().getCliente().getNome();
            if (nota.getVenda().getCliente().getDocumento() != null) docCliente = nota.getVenda().getCliente().getDocumento();
        }

        parametros.put("CLIENTE_NOME", nomeCliente);
        parametros.put("CLIENTE_DOC", docCliente);

        // --- DADOS DA NOTA FISCAL ---
        parametros.put("CHAVE_ACESSO", nota.getChaveAcesso());
        parametros.put("NUMERO_NOTA", nota.getNumero() != null ? String.valueOf(nota.getNumero()) : "S/N");        parametros.put("PROTOCOLO", nota.getProtocolo());

        // --- VENDEDOR E VALORES ---
        parametros.put("VENDEDOR", nota.getVenda() != null ? nota.getVenda().getVendedorNome() : "Sistema");
        parametros.put("VALOR_TOTAL", nota.getVenda() != null ? nota.getVenda().getValorTotal() : 0.0);
        // Formata a data de emissão no padrão brasileiro
        String dataFormatada = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date.from(nota.getDataEmissao().atZone(java.time.ZoneId.systemDefault()).toInstant()));
        parametros.put("DATA_EMISSAO", dataFormatada);


        // 4. Prepara os itens da venda (corpo da tabela)
        List<ItemVenda> itens = nota.getVenda() != null ? nota.getVenda().getItens() : List.of();
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(itens);

        // 5. Compila e gera o binário do PDF
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, dataSource);

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}