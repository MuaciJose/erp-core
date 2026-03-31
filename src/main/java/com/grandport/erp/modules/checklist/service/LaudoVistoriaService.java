package com.grandport.erp.modules.checklist.service;

import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class LaudoVistoriaService {

    private final ChecklistService checklistService;
    private final ConfiguracaoAtualService configuracaoAtualService;
    private final LaudoVistoriaTemplateService laudoVistoriaTemplateService;

    private final ConcurrentMap<String, JasperReport> reportCache = new ConcurrentHashMap<>();

    public byte[] gerarLaudoPdf(Long checklistId) {
        try {
            ChecklistVeiculo vistoria = checklistService.buscarPorId(checklistId);
            ConfiguracaoSistema config = configuracaoAtualService.obterAtual();
            Map<String, Object> parametros = buildParametros(vistoria, config);
            JasperReport jasperReport = resolveReport();
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, new JREmptyDataSource());
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (JRException e) {
            log.error("Falha Jasper ao gerar PDF do laudo. checklistId={}", checklistId, e);
            throw new RuntimeException("Erro técnico ao gerar o PDF do Laudo.", e);
        } catch (RuntimeException e) {
            log.error("Falha ao gerar PDF do laudo. checklistId={}", checklistId, e);
            throw e;
        }
    }

    public byte[] gerarPreviewPdf(Long checklistId) {
        return gerarPreviewPdfComTemplate(null, checklistId);
    }

    public byte[] gerarPreviewPdfComTemplate(String jrxml, Long checklistId) {
        try {
            ConfiguracaoSistema config = configuracaoAtualService.obterAtual();
            ChecklistVeiculo vistoria = resolvePreviewChecklist(checklistId);
            Map<String, Object> parametros = buildParametros(vistoria, config);
            JasperReport jasperReport = jrxml != null && !jrxml.isBlank()
                    ? compileReportTemplate(jrxml)
                    : resolveReport();
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, new JREmptyDataSource());
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (JRException e) {
            log.error("Falha Jasper ao gerar preview do laudo. checklistId={}", checklistId, e);
            throw new RuntimeException("Erro técnico ao gerar preview do laudo.", e);
        } catch (RuntimeException e) {
            log.error("Falha ao gerar preview do laudo. checklistId={}", checklistId, e);
            throw e;
        }
    }

    private Map<String, Object> buildParametros(ChecklistVeiculo vistoria, ConfiguracaoSistema config) {
        Map<String, Object> parametros = new HashMap<>();

        parametros.put(
                "EMPRESA_NOME",
                config.getNomeFantasia() != null && !config.getNomeFantasia().isEmpty()
                        ? config.getNomeFantasia()
                        : "OFICINA NÃO CONFIGURADA"
        );
        parametros.put("EMPRESA_CNPJ", config.getCnpj() != null ? config.getCnpj() : "");
        parametros.put("EMPRESA_TELEFONE", config.getTelefone() != null ? config.getTelefone() : "");
        parametros.put("EMPRESA_ENDERECO", buildEnderecoCompleto(config));

        parametros.put("PLACA", vistoria.getVeiculo().getPlaca());
        parametros.put("MODELO", vistoria.getVeiculo().getModelo());
        parametros.put("CLIENTE_NOME", vistoria.getCliente() != null ? vistoria.getCliente().getNome() : "Não informado");
        parametros.put("DATA_ENTRADA", vistoria.getDataRegistro() != null ? vistoria.getDataRegistro().toString() : "");
        parametros.put("KM", vistoria.getKmAtual() != null ? vistoria.getKmAtual().toString() : "---");
        parametros.put("COMBUSTIVEL", vistoria.getNivelCombustivel());
        parametros.put("AVARIAS", vistoria.getItensAvariados());
        parametros.put("OBSERVACOES", vistoria.getObservacoesGerais());
        parametros.put("ASSINATURA_URL", vistoria.getUrlAssinaturaCliente());

        List<String> fotos = vistoria.getFotos();
        if (fotos != null) {
            if (fotos.size() > 0) parametros.put("FOTO_1", fotos.get(0));
            if (fotos.size() > 1) parametros.put("FOTO_2", fotos.get(1));
            if (fotos.size() > 2) parametros.put("FOTO_3", fotos.get(2));
            if (fotos.size() > 3) parametros.put("FOTO_4", fotos.get(3));
        }

        return parametros;
    }

    private JasperReport resolveReport() {
        String jrxml = laudoVistoriaTemplateService.obterTemplateCompilavel();
        String cacheKey = buildCacheKey(jrxml);
        return reportCache.computeIfAbsent(cacheKey, key -> compileReportTemplate(jrxml));
    }

    private ChecklistVeiculo resolvePreviewChecklist(Long checklistId) {
        if (checklistId != null) {
            return checklistService.buscarPorId(checklistId);
        }

        ChecklistVeiculo checklist = checklistService.buscarMaisRecenteDaEmpresa();
        if (checklist != null) {
            return checklist;
        }

        return buildMockChecklist();
    }

    private JasperReport compileReportTemplate(String jrxml) {
        try (ByteArrayInputStream in = new ByteArrayInputStream(jrxml.getBytes(StandardCharsets.UTF_8))) {
            return JasperCompileManager.compileReport(in);
        } catch (JRException | IOException e) {
            throw new IllegalStateException("Falha ao compilar template do laudo.", e);
        }
    }

    private String buildEnderecoCompleto(ConfiguracaoSistema config) {
        String enderecoCompleto = config.getEndereco();
        if (enderecoCompleto == null || enderecoCompleto.isEmpty()) {
            String logradouro = config.getLogradouro() != null ? config.getLogradouro() : "";
            String numero = config.getNumero() != null ? config.getNumero() : "S/N";
            String cidade = config.getCidade() != null ? config.getCidade() : "";
            String uf = config.getUf() != null ? config.getUf() : "";

            enderecoCompleto = logradouro + ", " + numero + " - " + cidade + "/" + uf;
            if (enderecoCompleto.equals(", S/N - /")) {
                enderecoCompleto = "";
            }
        }
        return enderecoCompleto;
    }

    private String buildCacheKey(String jrxml) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(jrxml.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível para cache do laudo.", e);
        }
    }

    private ChecklistVeiculo buildMockChecklist() {
        Veiculo veiculo = new Veiculo();
        veiculo.setPlaca("ABC1D23");
        veiculo.setModelo("Fiat Strada Freedom");

        Parceiro cliente = new Parceiro();
        cliente.setNome("Cliente Exemplo");

        ChecklistVeiculo checklist = new ChecklistVeiculo();
        checklist.setVeiculo(veiculo);
        checklist.setCliente(cliente);
        checklist.setKmAtual(52340);
        checklist.setNivelCombustivel("1/2 tanque");
        checklist.setItensAvariados("Para-choque dianteiro com risco leve; pneu traseiro direito com desgaste.");
        checklist.setObservacoesGerais("Preview automático do laudo. Ajuste o layout com base nesta estrutura.");
        checklist.setUrlAssinaturaCliente(null);
        checklist.setFotos(List.of());
        return checklist;
    }
}
