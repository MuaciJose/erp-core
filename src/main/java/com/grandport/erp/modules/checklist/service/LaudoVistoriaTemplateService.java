package com.grandport.erp.modules.checklist.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
@RequiredArgsConstructor
public class LaudoVistoriaTemplateService {

    public record OfficialLaudoTemplatePayload(
            String jrxml,
            String styleId,
            String label
    ) {}

    public record LaudoTemplateState(
            String jrxml,
            boolean customizado,
            String source,
            String templateType,
            boolean hasDraft,
            Long draftVersion,
            Long publishedVersion
    ) {}

    private static final String DEFAULT_TEMPLATE_PATH = "default-templates/laudo-vistoria.jrxml";
    private static final String DEFAULT_TEMPLATE_STYLE_ID = "01-executivo";
    private static final String DEFAULT_TEMPLATE_LABEL = "Default oficial premium";

    private final ConfiguracaoService configuracaoService;

    public LaudoTemplateState obterTemplateAtual() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String custom = config.getLayoutJrxmlLaudoVistoria();
        if (custom != null && !custom.isBlank()) {
            return new LaudoTemplateState(custom, true, "database", "jrxml", false, null, null);
        }
        return new LaudoTemplateState(readDefaultTemplate(), false, "classpath", "jrxml", false, null, null);
    }

    public void salvarTemplate(String jrxml) {
        validateTemplate(jrxml);
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        config.setLayoutJrxmlLaudoVistoria(jrxml);
        configuracaoService.atualizarConfiguracao(config);
        log.info("Template JRXML do laudo salvo para empresaId={}", config.getEmpresaId());
    }

    public void resetarTemplate() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        config.setLayoutJrxmlLaudoVistoria(null);
        configuracaoService.atualizarConfiguracao(config);
        log.info("Template JRXML do laudo resetado para o padrão de classpath na empresaId={}", config.getEmpresaId());
    }

    public String obterTemplateCompilavel() {
        LaudoTemplateState state = obterTemplateAtual();
        validateTemplate(state.jrxml());
        return state.jrxml();
    }

    public void validateTemplate(String jrxml) {
        if (jrxml == null || jrxml.isBlank()) {
            throw new IllegalArgumentException("JRXML do laudo não pode estar vazio.");
        }
        if (!jrxml.contains("<jasperReport")) {
            throw new IllegalArgumentException("Template do laudo deve conter a tag <jasperReport>.");
        }
        try (InputStream in = new ByteArrayInputStream(jrxml.getBytes(StandardCharsets.UTF_8))) {
            JasperCompileManager.compileReport(in);
        } catch (JRException e) {
            throw new IllegalArgumentException("JRXML inválido para o laudo: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao validar template do laudo.", e);
        }
    }

    public String readDefaultTemplate() {
        try (InputStream in = new ClassPathResource(DEFAULT_TEMPLATE_PATH).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler o template padrão do laudo.", e);
        }
    }

    public OfficialLaudoTemplatePayload getOfficialTemplate() {
        return new OfficialLaudoTemplatePayload(
                readDefaultTemplate(),
                DEFAULT_TEMPLATE_STYLE_ID,
                DEFAULT_TEMPLATE_LABEL
        );
    }
}
