package com.grandport.erp.modules.configuracoes.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class OfficialLayoutTemplateService {

    private static final Map<String, OfficialTemplateDescriptor> TEMPLATES = Map.ofEntries(
            Map.entry("os", new OfficialTemplateDescriptor("default-templates/os.html", "03-automotivo", "Default oficial premium")),
            Map.entry("venda", new OfficialTemplateDescriptor("default-templates/venda.html", "02-corporativo", "Default oficial premium")),
            Map.entry("recibo", new OfficialTemplateDescriptor("default-templates/recibo.html", "01-executivo", "Default oficial premium")),
            Map.entry("recibopagamento", new OfficialTemplateDescriptor("default-templates/recibo-pagamento.html", "02-corporativo", "Default oficial premium")),
            Map.entry("fechamentocaixa", new OfficialTemplateDescriptor("default-templates/fechamento-caixa.html", "03-automotivo", "Default oficial premium")),
            Map.entry("espelhonota", new OfficialTemplateDescriptor("default-templates/espelho-nota.html", "02-corporativo", "Default oficial premium")),
            Map.entry("dre", new OfficialTemplateDescriptor("default-templates/dre.html", "02-corporativo", "Default oficial premium")),
            Map.entry("extratocliente", new OfficialTemplateDescriptor("default-templates/extrato-cliente.html", "02-corporativo", "Default oficial premium")),
            Map.entry("extratofornecedor", new OfficialTemplateDescriptor("default-templates/extrato-fornecedor.html", "02-corporativo", "Default oficial premium")),
            Map.entry("relatoriocomissao", new OfficialTemplateDescriptor("default-templates/relatorio-comissao.html", "01-executivo", "Default oficial premium")),
            Map.entry("relatoriocontaspagar", new OfficialTemplateDescriptor("default-templates/relatorio-contas-pagar.html", "02-corporativo", "Default oficial premium")),
            Map.entry("relatoriocontasreceber", new OfficialTemplateDescriptor("default-templates/relatorio-contas-receber.html", "02-corporativo", "Default oficial premium"))
    );

    public OfficialTemplatePayload getOfficialTemplate(String tipoLayout) {
        OfficialTemplateDescriptor descriptor = TEMPLATES.get(normalize(tipoLayout));
        if (descriptor == null) {
            throw new IllegalArgumentException("Tipo de layout não possui template oficial: " + tipoLayout);
        }
        return new OfficialTemplatePayload(
                readClasspathTemplate(descriptor.classpathLocation()),
                descriptor.styleId(),
                descriptor.label()
        );
    }

    private String readClasspathTemplate(String classpathLocation) {
        try (InputStream in = new ClassPathResource(classpathLocation).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler o template oficial em " + classpathLocation, e);
        }
    }

    private String normalize(String tipoLayout) {
        return tipoLayout == null ? "" : tipoLayout.trim().toLowerCase();
    }

    private record OfficialTemplateDescriptor(String classpathLocation, String styleId, String label) {}

    public record OfficialTemplatePayload(String html, String styleId, String label) {}
}
