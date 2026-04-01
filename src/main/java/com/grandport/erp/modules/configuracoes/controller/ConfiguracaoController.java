package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateVersioningService;
import com.grandport.erp.modules.checklist.service.ChecklistService;
import com.grandport.erp.modules.fiscal.service.DanfeService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateVersioningService;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.configuracoes.service.LayoutTemplateVersioningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    @Autowired
    private ConfiguracaoService service;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.LayoutTemplateGovernanceService layoutTemplateGovernanceService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.LayoutPreviewDataService layoutPreviewDataService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.OfficialLayoutTemplateService officialLayoutTemplateService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.PremiumTemplateLibraryService premiumTemplateLibraryService;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private LayoutTemplateVersioningService layoutTemplateVersioningService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.ManutencaoService manutencaoService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.PrintingGovernanceOverviewService printingGovernanceOverviewService;

    @Autowired
    private LaudoVistoriaTemplateService laudoVistoriaTemplateService;

    @Autowired
    private LaudoVistoriaService laudoVistoriaService;

    @Autowired
    private LaudoVistoriaTemplateVersioningService laudoVistoriaTemplateVersioningService;

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private DanfeTemplateService danfeTemplateService;

    @Autowired
    private DanfeTemplateVersioningService danfeTemplateVersioningService;

    @Autowired
    private DanfeService danfeService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<ConfiguracaoSistema> obterConfig() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<ConfiguracaoSistema> salvarConfig(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // 🆕 POST também funciona (alternativa ao PUT para compatibilidade)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<ConfiguracaoSistema> salvarConfigPost(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // 🆕 Inicializar configuração para nova empresa
    @PostMapping("/inicializar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<ConfiguracaoSistema> inicializarConfiguracao() {
        ConfiguracaoSistema config = service.obterConfiguracao();
        return ResponseEntity.ok(config);
    }

    // =======================================================================
    // 🚀 CERTIFICADO DIGITAL (.PFX) - ATUALIZADO
    // =======================================================================
    @PostMapping("/certificado")
    public ResponseEntity<?> uploadCertificado(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Arquivo de certificado vazio."));
        }

        try {
            // 🚀 AGORA CHAMA O SERVICE QUE SALVA COM O NOME DO CNPJ
            service.salvarCertificadoDigital(file);

            return ResponseEntity.ok(Map.of("message", "Certificado digital salvo com sucesso e vinculado ao CNPJ!"));

        } catch (Exception e) {
            // Em caso de erro (ex: CNPJ não preenchido), retorna a mensagem real do Service
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao salvar certificado: " + e.getMessage()));
        }
    }

    // =======================================================================
    // BACKUP, LOGS E MANUTENÇÃO
    // =======================================================================

    @GetMapping("/backup")
    public ResponseEntity<Resource> gerarBackup() {
        Resource arquivoBackup = service.gerarArquivoBackup();
        String nomeArquivo = "backup_grandport_" + java.time.LocalDate.now() + ".sql";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/sql"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeArquivo + "\"")
                .body(arquivoBackup);
    }

    @PostMapping("/limpar-logs")
    public ResponseEntity<Void> limparLogs() {
        service.limparLogsTecnicos();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restaurar-banco")
    public ResponseEntity<String> uploadBanco(@RequestParam("file") MultipartFile file) {
        try {
            service.restaurarBackup(file);
            return ResponseEntity.ok("{\"message\": \"Banco de dados restaurado com sucesso!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Falha na restauração: " + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/resetar-banco")
    public ResponseEntity<Void> resetarBancoDeDados() {
        service.resetarBancoDeDados();
        return ResponseEntity.ok().build();
    }



    // =========================================================
    // 🧹 ROTA DO ROBÔ: LIMPEZA DE FOTOS ANTIGAS
    // =========================================================
    @PostMapping("/manutencao/limpar-fotos-vistorias")
    public ResponseEntity<Map<String, Object>> limparFotosAntigas(
            @RequestParam(defaultValue = "24") int meses) { // Por padrão, apaga fotos com mais de 2 anos (24 meses)

        Map<String, Object> resultado = manutencaoService.limparFotosVistoriasAntigas(meses);
        return ResponseEntity.ok(resultado);
    }

    // =======================================================================
    // 🎨 CENTRAL DE LAYOUTS - GERENCIADOR DE TEMPLATES HTML
    // =======================================================================

    @GetMapping("/layouts")
    public ResponseEntity<Map<String, Object>> obterTodosLayouts() {
        ConfiguracaoSistema config = service.obterConfiguracao();
        
        Map<String, Object> layouts = new java.util.HashMap<>();
        layouts.put("extratoCliente", config.getLayoutHtmlExtratoCliente());
        layouts.put("extratoFornecedor", config.getLayoutHtmlExtratoFornecedor());
        layouts.put("os", config.getLayoutHtmlOs());
        layouts.put("venda", config.getLayoutHtmlVenda());
        layouts.put("recibo", config.getLayoutHtmlRecibo());
        layouts.put("reciboPagamento", config.getLayoutHtmlReciboPagamento());
        layouts.put("fechamentoCaixa", config.getLayoutHtmlFechamentoCaixa());
        layouts.put("espelhoNota", config.getLayoutHtmlEspelhoNota());
        layouts.put("dre", config.getLayoutHtmlDre());
        layouts.put("relatorioComissao", config.getLayoutHtmlRelatorioComissao());
        layouts.put("relatorioContasPagar", config.getLayoutHtmlRelatorioContasPagar());
        layouts.put("relatorioContasReceber", config.getLayoutHtmlRelatorioContasReceber());
        layouts.put("laudoVistoriaJrxml", config.getLayoutJrxmlLaudoVistoria());
        
        return ResponseEntity.ok(layouts);
    }

    @GetMapping("/layouts/overview")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterResumoGovernancaImpressao() {
        return ResponseEntity.ok(printingGovernanceOverviewService.getOverview());
    }

    @GetMapping("/laudo-vistoria/template")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateLaudoVistoria() {
        var state = laudoVistoriaTemplateVersioningService.getEditorState();
        var official = laudoVistoriaTemplateService.getOfficialTemplate();
        return ResponseEntity.ok(Map.ofEntries(
                Map.entry("jrxml", state.jrxml()),
                Map.entry("publishedJrxml", state.publishedJrxml()),
                Map.entry("customizado", state.customizado()),
                Map.entry("source", state.customizado() ? "database" : "classpath"),
                Map.entry("templateType", "jrxml"),
                Map.entry("hasDraft", state.hasDraft()),
                Map.entry("draftVersion", state.draftVersion() != null ? state.draftVersion() : ""),
                Map.entry("publishedVersion", state.publishedVersion() != null ? state.publishedVersion() : ""),
                Map.entry("officialStyleId", official.styleId()),
                Map.entry("officialLabel", official.label()),
                Map.entry("isEditorUsingOfficial", state.jrxml() != null && state.jrxml().equals(official.jrxml())),
                Map.entry("isPublishedUsingOfficial", state.publishedJrxml() != null && state.publishedJrxml().equals(official.jrxml()))
        ));
    }

    @GetMapping("/laudo-vistoria/template/official")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateOficialLaudoVistoria() {
        return ResponseEntity.ok(laudoVistoriaTemplateService.getOfficialTemplate());
    }

    @GetMapping("/danfe/template")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateDanfe() {
        var state = danfeTemplateVersioningService.getEditorState();
        var official = danfeTemplateService.getOfficialTemplate();
        return ResponseEntity.ok(Map.ofEntries(
                Map.entry("jrxml", state.jrxml()),
                Map.entry("publishedJrxml", state.publishedJrxml()),
                Map.entry("customizado", state.customizado()),
                Map.entry("source", state.customizado() ? "database" : "classpath"),
                Map.entry("templateType", "jrxml"),
                Map.entry("hasDraft", state.hasDraft()),
                Map.entry("draftVersion", state.draftVersion() != null ? state.draftVersion() : ""),
                Map.entry("publishedVersion", state.publishedVersion() != null ? state.publishedVersion() : ""),
                Map.entry("officialStyleId", official.styleId()),
                Map.entry("officialLabel", official.label()),
                Map.entry("isEditorUsingOfficial", state.jrxml() != null && state.jrxml().equals(official.jrxml())),
                Map.entry("isPublishedUsingOfficial", state.publishedJrxml() != null && state.publishedJrxml().equals(official.jrxml()))
        ));
    }

    @GetMapping("/danfe/template/official")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateOficialDanfe() {
        return ResponseEntity.ok(danfeTemplateService.getOfficialTemplate());
    }

    @GetMapping("/danfe/template/library")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> listarBibliotecaDanfe() {
        return ResponseEntity.ok(premiumTemplateLibraryService.listDanfeTemplates());
    }

    @GetMapping("/danfe/template/library/{styleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateBibliotecaDanfe(@PathVariable String styleId) {
        try {
            return ResponseEntity.ok(premiumTemplateLibraryService.getDanfeTemplate(styleId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/danfe/template/library/{styleId}/preview")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> previewTemplateBibliotecaDanfe(@PathVariable String styleId) {
        try {
            var template = premiumTemplateLibraryService.getDanfeTemplate(styleId);
            byte[] pdf = danfeService.gerarPreviewDanfePdf(template.content());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-library-danfe-" + styleId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falha ao gerar preview do template premium do DANFE: " + e.getMessage()));
        }
    }

    @PutMapping("/danfe/template")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> salvarTemplateDanfe(@RequestBody Map<String, String> payload) {
        try {
            var draft = danfeTemplateVersioningService.saveDraft(payload.get("jrxml"), payload.get("changeReason"));
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Draft do DANFE salvo com sucesso!",
                    "draftVersion", draft.versionNumber(),
                    "changeReason", draft.changeReason()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/danfe/template/historico")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterHistoricoTemplateDanfe() {
        return ResponseEntity.ok(danfeTemplateVersioningService.getHistory());
    }

    @PostMapping("/danfe/template/publish")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> publicarTemplateDanfe(@RequestBody(required = false) Map<String, String> payload) {
        try {
            var published = danfeTemplateVersioningService.publishDraft(payload != null ? payload.get("changeReason") : null);
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Template do DANFE publicado com sucesso!",
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/danfe/template/rollback/{versionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> rollbackTemplateDanfe(
            @PathVariable Long versionId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            var published = danfeTemplateVersioningService.rollbackToVersion(
                    versionId,
                    payload != null ? payload.get("changeReason") : null
            );
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Rollback do DANFE publicado com sucesso!",
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/danfe/template/diff")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterDiffTemplateDanfe() {
        return ResponseEntity.ok(danfeTemplateVersioningService.diffDraftAgainstPublished());
    }

    @PostMapping("/danfe/template/reset")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> resetarTemplateDanfe() {
        danfeTemplateVersioningService.resetPublished();
        return ResponseEntity.ok(Map.of("mensagem", "Template do DANFE resetado para o padrão."));
    }

    @PostMapping("/danfe/template/preview")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> previewTemplateDanfe(@RequestBody(required = false) Map<String, String> payload) {
        try {
            String jrxml = payload != null ? payload.get("jrxml") : null;
            byte[] pdf = danfeService.gerarPreviewDanfePdf((jrxml == null || jrxml.isBlank()) ? danfeTemplateVersioningService.getEditorState().jrxml() : jrxml);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-danfe.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falha ao gerar preview do DANFE: " + e.getMessage()));
        }
    }

    @GetMapping("/laudo-vistoria/template/library")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> listarBibliotecaLaudoVistoria() {
        return ResponseEntity.ok(premiumTemplateLibraryService.listLaudoTemplates());
    }

    @GetMapping("/laudo-vistoria/template/library/{styleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateBibliotecaLaudoVistoria(@PathVariable String styleId) {
        try {
            return ResponseEntity.ok(premiumTemplateLibraryService.getLaudoTemplate(styleId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/laudo-vistoria/template/library/{styleId}/preview")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> previewTemplateBibliotecaLaudoVistoria(
            @PathVariable String styleId,
            @RequestParam(required = false) Long checklistId) {
        try {
            var template = premiumTemplateLibraryService.getLaudoTemplate(styleId);
            byte[] pdf = laudoVistoriaService.gerarPreviewPdfComTemplate(template.content(), checklistId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-library-laudo-" + styleId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falha ao gerar preview do template premium: " + e.getMessage()));
        }
    }

    @PutMapping("/laudo-vistoria/template")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> salvarTemplateLaudoVistoria(@RequestBody Map<String, String> payload) {
        try {
            var draft = laudoVistoriaTemplateVersioningService.saveDraft(payload.get("jrxml"), payload.get("changeReason"));
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Draft do laudo salvo com sucesso!",
                    "draftVersion", draft.versionNumber(),
                    "changeReason", draft.changeReason()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/laudo-vistoria/template/historico")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterHistoricoTemplateLaudoVistoria() {
        return ResponseEntity.ok(laudoVistoriaTemplateVersioningService.getHistory());
    }

    @PostMapping("/laudo-vistoria/template/publish")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> publicarTemplateLaudoVistoria(@RequestBody(required = false) Map<String, String> payload) {
        try {
            var published = laudoVistoriaTemplateVersioningService.publishDraft(payload != null ? payload.get("changeReason") : null);
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Template do laudo publicado com sucesso!",
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/laudo-vistoria/template/rollback/{versionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> rollbackTemplateLaudoVistoria(
            @PathVariable Long versionId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            var published = laudoVistoriaTemplateVersioningService.rollbackToVersion(
                    versionId,
                    payload != null ? payload.get("changeReason") : null
            );
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Rollback do laudo publicado com sucesso!",
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/laudo-vistoria/template/diff")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterDiffTemplateLaudoVistoria() {
        return ResponseEntity.ok(laudoVistoriaTemplateVersioningService.diffDraftAgainstPublished());
    }

    @PostMapping("/laudo-vistoria/template/reset")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> resetarTemplateLaudoVistoria() {
        laudoVistoriaTemplateVersioningService.resetPublished();
        return ResponseEntity.ok(Map.of("mensagem", "Template do laudo resetado para o padrão."));
    }

    @GetMapping("/laudo-vistoria/template/preview")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> previewTemplateLaudoVistoria(@RequestParam(required = false) Long checklistId) {
        try {
            byte[] pdf = laudoVistoriaService.gerarPreviewPdf(checklistId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-laudo-vistoria.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/laudo-vistoria/template/preview-contexts")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> listarContextosPreviewLaudoVistoria() {
        return ResponseEntity.ok(
                checklistService.listarRecentesDaEmpresa().stream()
                        .map(checklist -> Map.of(
                                "id", checklist.getId(),
                                "placa", checklist.getVeiculo() != null && checklist.getVeiculo().getPlaca() != null
                                        ? checklist.getVeiculo().getPlaca()
                                        : "Sem placa",
                                "modelo", checklist.getVeiculo() != null && checklist.getVeiculo().getModelo() != null
                                        ? checklist.getVeiculo().getModelo()
                                        : "Sem modelo",
                                "cliente", checklist.getCliente() != null && checklist.getCliente().getNome() != null
                                        ? checklist.getCliente().getNome()
                                        : "Sem cliente",
                                "dataRegistro", checklist.getDataRegistro() != null ? checklist.getDataRegistro().toString() : ""
                        ))
                        .toList()
        );
    }

    @GetMapping("/layouts/{tipoLayout}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterLayout(@PathVariable String tipoLayout) {
        try {
            LayoutTemplateVersioningService.LayoutEditorState state = layoutTemplateVersioningService.getEditorState(tipoLayout);
            var official = officialLayoutTemplateService.getOfficialTemplate(tipoLayout);
            return ResponseEntity.ok(Map.of(
                    "tipoLayout", state.tipoLayout(),
                    "html", state.html(),
                    "publishedHtml", state.publishedHtml(),
                    "hasDraft", state.hasDraft(),
                    "draftVersion", state.draftVersion() != null ? state.draftVersion() : "",
                    "publishedVersion", state.publishedVersion() != null ? state.publishedVersion() : "",
                    "officialStyleId", official.styleId(),
                    "officialLabel", official.label(),
                    "isEditorUsingOfficial", state.html() != null && state.html().equals(official.html()),
                    "isPublishedUsingOfficial", state.publishedHtml() != null && state.publishedHtml().equals(official.html())
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/official")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateOficialLayout(@PathVariable String tipoLayout) {
        try {
            return ResponseEntity.ok(officialLayoutTemplateService.getOfficialTemplate(tipoLayout));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/library")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> listarBibliotecaLayout(@PathVariable String tipoLayout) {
        try {
            return ResponseEntity.ok(premiumTemplateLibraryService.listHtmlTemplates(tipoLayout));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/library/{styleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterTemplateBibliotecaLayout(
            @PathVariable String tipoLayout,
            @PathVariable String styleId) {
        try {
            return ResponseEntity.ok(premiumTemplateLibraryService.getHtmlTemplate(tipoLayout, styleId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/library/{styleId}/preview-pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> previewTemplateBibliotecaLayout(
            @PathVariable String tipoLayout,
            @PathVariable String styleId) {
        try {
            var template = premiumTemplateLibraryService.getHtmlTemplate(tipoLayout, styleId);
            byte[] pdf = pdfService.gerarPdfDeStringHtml(
                    template.content(),
                    layoutPreviewDataService.buildPreviewVariables(tipoLayout)
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-library-" + tipoLayout + "-" + styleId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falha ao gerar preview do template premium: " + e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/metadata")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterMetadataLayout(@PathVariable String tipoLayout) {
        try {
            return ResponseEntity.ok(layoutTemplateGovernanceService.getMetadata(tipoLayout));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/{tipoLayout}/preview-pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> gerarPreviewLayout(@PathVariable String tipoLayout, @RequestBody Map<String, String> payload) {
        String html = payload.get("html");
        if (html == null || html.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "HTML não pode estar vazio"));
        }

        var validation = layoutTemplateGovernanceService.validate(tipoLayout, html);
        if (!validation.valid()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Layout rejeitado pela validação.",
                    "errors", validation.errors(),
                    "warnings", validation.warnings()
            ));
        }

        try {
            byte[] pdf = pdfService.gerarPdfDeStringHtml(
                    html,
                    layoutPreviewDataService.buildPreviewVariables(tipoLayout)
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview-" + tipoLayout + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falha ao gerar preview do layout: " + e.getMessage()));
        }
    }

    @PutMapping("/layouts/{tipoLayout}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarLayout(
            @PathVariable String tipoLayout,
            @RequestBody Map<String, String> payload) {
        
        String html = payload.get("html");
        if (html == null || html.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "HTML não pode estar vazio"));
        }
        
        var validation = layoutTemplateGovernanceService.validate(tipoLayout, html);
        if (!validation.valid()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Layout rejeitado pela validação.",
                    "errors", validation.errors(),
                    "warnings", validation.warnings(),
                    "availableVariables", validation.availableVariables(),
                    "notes", validation.notes()
            ));
        }

        LayoutTemplateVersioningService.LayoutVersionSummary draft = layoutTemplateVersioningService.saveDraft(
                tipoLayout,
                html,
                payload.get("changeReason")
        );
        
        return ResponseEntity.ok(Map.of(
                "mensagem", "Draft salvo com sucesso!",
                "tipoLayout", tipoLayout,
                "draftVersion", draft.versionNumber(),
                "changeReason", draft.changeReason(),
                "warnings", validation.warnings(),
                "availableVariables", validation.availableVariables(),
                "notes", validation.notes()
        ));
    }

    @GetMapping("/layouts/{tipoLayout}/historico")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterHistoricoLayout(@PathVariable String tipoLayout) {
        try {
            return ResponseEntity.ok(layoutTemplateVersioningService.getHistory(tipoLayout));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/{tipoLayout}/publish")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> publicarDraft(@PathVariable String tipoLayout) {
        try {
            LayoutTemplateVersioningService.LayoutVersionSummary published = layoutTemplateVersioningService.publishDraft(
                    tipoLayout,
                    null
            );
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Layout publicado com sucesso!",
                    "tipoLayout", tipoLayout,
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/{tipoLayout}/publish-with-reason")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> publicarDraftComMotivo(@PathVariable String tipoLayout, @RequestBody(required = false) Map<String, String> payload) {
        try {
            LayoutTemplateVersioningService.LayoutVersionSummary published = layoutTemplateVersioningService.publishDraft(
                    tipoLayout,
                    payload != null ? payload.get("changeReason") : null
            );
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Layout publicado com sucesso!",
                    "tipoLayout", tipoLayout,
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/{tipoLayout}/rollback/{versionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> rollbackLayout(@PathVariable String tipoLayout, @PathVariable Long versionId) {
        try {
            LayoutTemplateVersioningService.LayoutVersionSummary published =
                    layoutTemplateVersioningService.rollbackToVersion(tipoLayout, versionId, null);
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Rollback publicado com sucesso!",
                    "tipoLayout", tipoLayout,
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/{tipoLayout}/rollback/{versionId}/with-reason")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> rollbackLayoutComMotivo(
            @PathVariable String tipoLayout,
            @PathVariable Long versionId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            LayoutTemplateVersioningService.LayoutVersionSummary published =
                    layoutTemplateVersioningService.rollbackToVersion(
                            tipoLayout,
                            versionId,
                            payload != null ? payload.get("changeReason") : null
                    );
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Rollback publicado com sucesso!",
                    "tipoLayout", tipoLayout,
                    "publishedVersion", published.versionNumber()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/layouts/{tipoLayout}/diff")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> obterDiffLayout(@PathVariable String tipoLayout) {
        try {
            return ResponseEntity.ok(layoutTemplateVersioningService.diffDraftAgainstPublished(tipoLayout));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/layouts/reset/{tipoLayout}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<Map<String, String>> resetarLayout(@PathVariable String tipoLayout) {
        try {
            layoutTemplateVersioningService.resetPublishedLayout(tipoLayout);
            return ResponseEntity.ok(Map.of("mensagem", "Layout resetado para padrão!", "tipoLayout", tipoLayout));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
