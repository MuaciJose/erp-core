package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.model.LayoutTemplateVersion;
import com.grandport.erp.modules.configuracoes.repository.LayoutTemplateVersionRepository;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DanfeTemplateVersioningService {

    private static final String TEMPLATE_KEY = "danfejrxml";

    private final LayoutTemplateVersionRepository repository;
    private final ConfiguracaoService configuracaoService;
    private final EmpresaContextService empresaContextService;
    private final DanfeTemplateService templateService;

    public DanfeTemplateVersioningService(
            LayoutTemplateVersionRepository repository,
            ConfiguracaoService configuracaoService,
            EmpresaContextService empresaContextService,
            DanfeTemplateService templateService
    ) {
        this.repository = repository;
        this.configuracaoService = configuracaoService;
        this.empresaContextService = empresaContextService;
        this.templateService = templateService;
    }

    public record EditorState(
            String jrxml,
            String publishedJrxml,
            boolean customizado,
            boolean hasDraft,
            Long draftVersion,
            Long publishedVersion
    ) {}

    public record VersionSummary(
            Long id,
            Long versionNumber,
            String status,
            String changeReason,
            String createdBy,
            String publishedBy,
            Long sourceVersionId,
            LocalDateTime createdAt,
            LocalDateTime publishedAt
    ) {}

    public record DiffLine(String type, String content) {}

    public record DiffResult(
            boolean hasChanges,
            int draftLineCount,
            int publishedLineCount,
            List<DiffLine> lines
    ) {}

    public EditorState getEditorState() {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        LayoutTemplateVersion draft = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId, TEMPLATE_KEY, LayoutTemplateVersion.Status.DRAFT
                )
                .orElse(null);
        LayoutTemplateVersion published = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId, TEMPLATE_KEY, LayoutTemplateVersion.Status.PUBLISHED
                )
                .orElse(null);

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String publishedJrxml = config.getLayoutJrxmlDanfe();
        if (publishedJrxml == null || publishedJrxml.isBlank()) {
            publishedJrxml = templateService.readDefaultTemplate();
        }

        return new EditorState(
                draft != null ? emptyIfNull(draft.getHtmlContent()) : emptyIfNull(publishedJrxml),
                emptyIfNull(publishedJrxml),
                config.getLayoutJrxmlDanfe() != null && !config.getLayoutJrxmlDanfe().isBlank(),
                draft != null,
                draft != null ? draft.getVersionNumber() : null,
                published != null ? published.getVersionNumber() : null
        );
    }

    public List<VersionSummary> getHistory() {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        return repository.findByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(empresaId, TEMPLATE_KEY)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public VersionSummary saveDraft(String jrxml, String changeReason) {
        templateService.validateTemplate(jrxml);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                empresaId, TEMPLATE_KEY, LayoutTemplateVersion.Status.DRAFT
        ).ifPresent(existing -> {
            existing.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
            repository.save(existing);
        });

        LayoutTemplateVersion draft = new LayoutTemplateVersion();
        draft.setEmpresaId(empresaId);
        draft.setTipoLayout(TEMPLATE_KEY);
        draft.setVersionNumber(nextVersionNumber(empresaId));
        draft.setStatus(LayoutTemplateVersion.Status.DRAFT);
        draft.setHtmlContent(jrxml);
        draft.setChangeReason(blankToNull(changeReason));
        draft.setCreatedBy(resolveActor());
        return toSummary(repository.save(draft));
    }

    @Transactional
    public VersionSummary publishDraft(String changeReason) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        LayoutTemplateVersion draft = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId, TEMPLATE_KEY, LayoutTemplateVersion.Status.DRAFT
                )
                .orElseThrow(() -> new IllegalStateException("Nenhum draft do DANFE encontrado para publicar."));
        return publishFromSource(draft, changeReason);
    }

    @Transactional
    public VersionSummary rollbackToVersion(Long versionId, String changeReason) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        LayoutTemplateVersion source = repository.findByEmpresaIdAndId(empresaId, versionId)
                .filter(version -> TEMPLATE_KEY.equals(version.getTipoLayout()))
                .orElseThrow(() -> new IllegalArgumentException("Versão do DANFE não encontrada para rollback."));
        return publishFromSource(source, changeReason);
    }

    @Transactional
    public void resetPublished() {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        archiveByStatus(empresaId, LayoutTemplateVersion.Status.DRAFT);
        archiveByStatus(empresaId, LayoutTemplateVersion.Status.PUBLISHED);

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        config.setLayoutJrxmlDanfe(null);
        configuracaoService.atualizarConfiguracao(config);
    }

    public DiffResult diffDraftAgainstPublished() {
        EditorState state = getEditorState();
        List<String> draftLines = splitLines(state.jrxml());
        List<String> publishedLines = splitLines(state.publishedJrxml());
        int max = Math.max(draftLines.size(), publishedLines.size());
        List<DiffLine> diffLines = new java.util.ArrayList<>();

        for (int i = 0; i < max; i++) {
            String draftLine = i < draftLines.size() ? draftLines.get(i) : null;
            String publishedLine = i < publishedLines.size() ? publishedLines.get(i) : null;

            if (java.util.Objects.equals(draftLine, publishedLine)) {
                continue;
            }
            if (publishedLine != null && !publishedLine.isBlank()) {
                diffLines.add(new DiffLine("removed", publishedLine));
            }
            if (draftLine != null && !draftLine.isBlank()) {
                diffLines.add(new DiffLine("added", draftLine));
            }
            if (diffLines.size() >= 80) {
                diffLines.add(new DiffLine("info", "... diff truncado para manter legibilidade ..."));
                break;
            }
        }

        return new DiffResult(!diffLines.isEmpty(), draftLines.size(), publishedLines.size(), diffLines);
    }

    private VersionSummary publishFromSource(LayoutTemplateVersion source, String changeReason) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        archiveByStatus(empresaId, LayoutTemplateVersion.Status.PUBLISHED);

        LayoutTemplateVersion published = new LayoutTemplateVersion();
        published.setEmpresaId(empresaId);
        published.setTipoLayout(TEMPLATE_KEY);
        published.setVersionNumber(nextVersionNumber(empresaId));
        published.setStatus(LayoutTemplateVersion.Status.PUBLISHED);
        published.setHtmlContent(source.getHtmlContent());
        published.setChangeReason(blankToNull(changeReason) != null ? blankToNull(changeReason) : source.getChangeReason());
        published.setCreatedBy(resolveActor());
        published.setPublishedBy(resolveActor());
        published.setSourceVersionId(source.getId());
        published.setPublishedAt(LocalDateTime.now());
        LayoutTemplateVersion saved = repository.save(published);

        if (source.getStatus() == LayoutTemplateVersion.Status.DRAFT) {
            source.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
            repository.save(source);
        }

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        config.setLayoutJrxmlDanfe(source.getHtmlContent());
        configuracaoService.atualizarConfiguracao(config);
        return toSummary(saved);
    }

    private void archiveByStatus(Long empresaId, LayoutTemplateVersion.Status status) {
        repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(empresaId, TEMPLATE_KEY, status)
                .ifPresent(version -> {
                    version.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
                    repository.save(version);
                });
    }

    private Long nextVersionNumber(Long empresaId) {
        return repository.findFirstByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(empresaId, TEMPLATE_KEY)
                .map(LayoutTemplateVersion::getVersionNumber)
                .orElse(0L) + 1L;
    }

    private VersionSummary toSummary(LayoutTemplateVersion version) {
        return new VersionSummary(
                version.getId(),
                version.getVersionNumber(),
                version.getStatus().name(),
                version.getChangeReason(),
                version.getCreatedBy(),
                version.getPublishedBy(),
                version.getSourceVersionId(),
                version.getCreatedAt(),
                version.getPublishedAt()
        );
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "sistema";
        }
        return authentication.getName();
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }

    private List<String> splitLines(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        return content.lines().toList();
    }
}
