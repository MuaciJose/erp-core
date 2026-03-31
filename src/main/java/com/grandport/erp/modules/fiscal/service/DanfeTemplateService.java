package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class DanfeTemplateService {

    public record OfficialDanfeTemplatePayload(
            String jrxml,
            String styleId,
            String label
    ) {}

    private static final String DEFAULT_TEMPLATE_PATH = "reports/danfe.jrxml";
    private static final String DEFAULT_TEMPLATE_STYLE_ID = "02-corporativo";
    private static final String DEFAULT_TEMPLATE_LABEL = "Default oficial premium";

    private final ConfiguracaoService configuracaoService;

    public String obterTemplateCompilavel() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String custom = config.getLayoutJrxmlDanfe();
        String jrxml = (custom != null && !custom.isBlank()) ? custom : readDefaultTemplate();
        validateTemplate(jrxml);
        return jrxml;
    }

    public String readDefaultTemplate() {
        try (InputStream in = new ClassPathResource(DEFAULT_TEMPLATE_PATH).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler o template padrão do DANFE.", e);
        }
    }

    public OfficialDanfeTemplatePayload getOfficialTemplate() {
        return new OfficialDanfeTemplatePayload(
                readDefaultTemplate(),
                DEFAULT_TEMPLATE_STYLE_ID,
                DEFAULT_TEMPLATE_LABEL
        );
    }

    public void validateTemplate(String jrxml) {
        if (jrxml == null || jrxml.isBlank()) {
            throw new IllegalArgumentException("JRXML do DANFE não pode estar vazio.");
        }
        if (!jrxml.contains("<jasperReport")) {
            throw new IllegalArgumentException("Template do DANFE deve conter a tag <jasperReport>.");
        }
        try (InputStream in = new ByteArrayInputStream(jrxml.getBytes(StandardCharsets.UTF_8))) {
            JasperCompileManager.compileReport(in);
        } catch (JRException e) {
            throw new IllegalArgumentException("JRXML inválido para o DANFE: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao validar template do DANFE.", e);
        }
    }
}
