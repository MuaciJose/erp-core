package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class PremiumTemplateLibraryService {

    private static final Path LIBRARY_ROOT = Path.of("TEMPLATES_PREMIUM_IMPRESSAO");

    private static final Map<String, String> HTML_LAYOUT_DIRECTORIES = Map.ofEntries(
            Map.entry("extratocliente", "extrato_cliente"),
            Map.entry("extratofornecedor", "extrato_fornecedor"),
            Map.entry("os", "os"),
            Map.entry("venda", "venda"),
            Map.entry("recibo", "recibo"),
            Map.entry("recibopagamento", "recibo_pagamento"),
            Map.entry("fechamentocaixa", "fechamento_caixa"),
            Map.entry("espelhonota", "espelho_nota"),
            Map.entry("dre", "dre"),
            Map.entry("relatoriocomissao", "relatorio_comissao"),
            Map.entry("relatoriocontaspagar", "relatorio_contas_pagar"),
            Map.entry("relatoriocontasreceber", "relatorio_contas_receber")
    );

    private final OfficialLayoutTemplateService officialLayoutTemplateService;
    private final LaudoVistoriaTemplateService laudoVistoriaTemplateService;
    private final DanfeTemplateService danfeTemplateService;

    public PremiumTemplateLibraryService(
            OfficialLayoutTemplateService officialLayoutTemplateService,
            LaudoVistoriaTemplateService laudoVistoriaTemplateService,
            DanfeTemplateService danfeTemplateService
    ) {
        this.officialLayoutTemplateService = officialLayoutTemplateService;
        this.laudoVistoriaTemplateService = laudoVistoriaTemplateService;
        this.danfeTemplateService = danfeTemplateService;
    }

    public List<TemplateLibraryItem> listHtmlTemplates(String tipoLayout) {
        String normalized = normalize(tipoLayout);
        String directory = HTML_LAYOUT_DIRECTORIES.get(normalized);
        if (directory == null) {
            throw new IllegalArgumentException("Tipo de layout não possui biblioteca premium: " + tipoLayout);
        }

        String officialStyleId = officialLayoutTemplateService.getOfficialTemplate(tipoLayout).styleId();
        return listTemplates(LIBRARY_ROOT.resolve(directory), ".html", officialStyleId);
    }

    public TemplateLibraryContent getHtmlTemplate(String tipoLayout, String styleId) {
        String normalized = normalize(tipoLayout);
        String directory = HTML_LAYOUT_DIRECTORIES.get(normalized);
        if (directory == null) {
            throw new IllegalArgumentException("Tipo de layout não possui biblioteca premium: " + tipoLayout);
        }

        String officialStyleId = officialLayoutTemplateService.getOfficialTemplate(tipoLayout).styleId();
        return getTemplate(LIBRARY_ROOT.resolve(directory), styleId, ".html", officialStyleId);
    }

    public List<TemplateLibraryItem> listLaudoTemplates() {
        String officialStyleId = laudoVistoriaTemplateService.getOfficialTemplate().styleId();
        return listTemplates(LIBRARY_ROOT.resolve("laudo_vistoria_jrxml"), ".jrxml", officialStyleId);
    }

    public TemplateLibraryContent getLaudoTemplate(String styleId) {
        String officialStyleId = laudoVistoriaTemplateService.getOfficialTemplate().styleId();
        return getTemplate(LIBRARY_ROOT.resolve("laudo_vistoria_jrxml"), styleId, ".jrxml", officialStyleId);
    }

    public List<TemplateLibraryItem> listDanfeTemplates() {
        String officialStyleId = danfeTemplateService.getOfficialTemplate().styleId();
        return listTemplates(LIBRARY_ROOT.resolve("danfe_jrxml"), ".jrxml", officialStyleId);
    }

    public TemplateLibraryContent getDanfeTemplate(String styleId) {
        String officialStyleId = danfeTemplateService.getOfficialTemplate().styleId();
        return getTemplate(LIBRARY_ROOT.resolve("danfe_jrxml"), styleId, ".jrxml", officialStyleId);
    }

    private List<TemplateLibraryItem> listTemplates(Path directory, String extension, String officialStyleId) {
        ensureDirectory(directory);
        try (var stream = Files.list(directory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(extension))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(path -> toItem(path, officialStyleId))
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível listar a biblioteca premium em " + directory, e);
        }
    }

    private TemplateLibraryContent getTemplate(Path directory, String styleId, String extension, String officialStyleId) {
        ensureDirectory(directory);
        Path file = directory.resolve(styleId + extension);
        if (!Files.isRegularFile(file)) {
            throw new IllegalArgumentException("Template premium não encontrado: " + styleId);
        }
        return new TemplateLibraryContent(
                styleId,
                humanizeStyle(styleId),
                readFile(file),
                styleId.equals(officialStyleId)
        );
    }

    private TemplateLibraryItem toItem(Path path, String officialStyleId) {
        String filename = path.getFileName().toString();
        String styleId = filename.substring(0, filename.lastIndexOf('.'));
        return new TemplateLibraryItem(
                styleId,
                humanizeStyle(styleId),
                styleId.equals(officialStyleId)
        );
    }

    private String readFile(Path path) {
        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler o template premium em " + path, e);
        }
    }

    private void ensureDirectory(Path directory) {
        if (!Files.isDirectory(directory)) {
            throw new IllegalStateException("Biblioteca premium não encontrada em " + directory.toAbsolutePath());
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String humanizeStyle(String styleId) {
        int separator = styleId.indexOf('-');
        String base = separator >= 0 ? styleId.substring(separator + 1) : styleId;
        String[] parts = base.split("-");
        StringBuilder label = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!label.isEmpty()) {
                label.append(' ');
            }
            label.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return label.toString();
    }

    public record TemplateLibraryItem(String styleId, String label, boolean official) {}

    public record TemplateLibraryContent(String styleId, String label, String content, boolean official) {}
}
