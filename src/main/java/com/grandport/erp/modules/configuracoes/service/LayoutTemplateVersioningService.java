package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.model.LayoutTemplateVersion;
import com.grandport.erp.modules.configuracoes.repository.LayoutTemplateVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LayoutTemplateVersioningService {

    private final LayoutTemplateVersionRepository repository;
    private final ConfiguracaoService configuracaoService;
    private final EmpresaContextService empresaContextService;
    private final LayoutTemplateGovernanceService governanceService;

    public record LayoutEditorState(
            String tipoLayout,
            String html,
            String publishedHtml,
            boolean hasDraft,
            Long draftVersion,
            Long publishedVersion
    ) {}

    public record LayoutVersionSummary(
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

    public record LayoutDiffLine(
            String type,
            String content
    ) {}

    public record LayoutDiffResult(
            boolean hasChanges,
            int draftLineCount,
            int publishedLineCount,
            List<LayoutDiffLine> lines
    ) {}

    public LayoutEditorState getEditorState(String tipoLayout) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        LayoutTemplateVersion draft = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId,
                        normalizedType,
                        LayoutTemplateVersion.Status.DRAFT
                )
                .orElse(null);

        LayoutTemplateVersion publishedVersion = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId,
                        normalizedType,
                        LayoutTemplateVersion.Status.PUBLISHED
                )
                .orElse(null);

        ConfiguracaoSistema configuracao = configuracaoService.obterConfiguracao();
        String publishedHtml = readLayout(configuracao, normalizedType);
        String html = draft != null ? emptyIfNull(draft.getHtmlContent()) : emptyIfNull(publishedHtml);

        return new LayoutEditorState(
                normalizedType,
                html,
                emptyIfNull(publishedHtml),
                draft != null,
                draft != null ? draft.getVersionNumber() : null,
                publishedVersion != null ? publishedVersion.getVersionNumber() : null
        );
    }

    public List<LayoutVersionSummary> getHistory(String tipoLayout) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        return repository.findByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(empresaId, normalizedType)
                .stream()
                .map(version -> new LayoutVersionSummary(
                        version.getId(),
                        version.getVersionNumber(),
                        version.getStatus().name(),
                        version.getChangeReason(),
                        version.getCreatedBy(),
                        version.getPublishedBy(),
                        version.getSourceVersionId(),
                        version.getCreatedAt(),
                        version.getPublishedAt()
                ))
                .toList();
    }

    @Transactional
    public LayoutVersionSummary saveDraft(String tipoLayout, String html, String changeReason) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                empresaId,
                normalizedType,
                LayoutTemplateVersion.Status.DRAFT
        ).ifPresent(existingDraft -> {
            existingDraft.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
            repository.save(existingDraft);
        });

        LayoutTemplateVersion draft = new LayoutTemplateVersion();
        draft.setEmpresaId(empresaId);
        draft.setTipoLayout(normalizedType);
        draft.setVersionNumber(nextVersionNumber(empresaId, normalizedType));
        draft.setStatus(LayoutTemplateVersion.Status.DRAFT);
        draft.setHtmlContent(html);
        draft.setChangeReason(blankToNull(changeReason));
        draft.setCreatedBy(resolveActor());

        return toSummary(repository.save(draft));
    }

    @Transactional
    public LayoutVersionSummary publishDraft(String tipoLayout, String changeReason) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        LayoutTemplateVersion draft = repository
                .findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                        empresaId,
                        normalizedType,
                        LayoutTemplateVersion.Status.DRAFT
                )
                .orElseThrow(() -> new IllegalStateException("Nenhum draft encontrado para publicar."));

        return publishFromSource(normalizedType, draft.getHtmlContent(), draft, changeReason);
    }

    @Transactional
    public LayoutVersionSummary rollbackToVersion(String tipoLayout, Long versionId, String changeReason) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        LayoutTemplateVersion source = repository.findByEmpresaIdAndId(empresaId, versionId)
                .filter(version -> version.getTipoLayout().equals(normalizedType))
                .orElseThrow(() -> new IllegalArgumentException("Versão de layout não encontrada para rollback."));

        return publishFromSource(normalizedType, source.getHtmlContent(), source, changeReason);
    }

    public LayoutDiffResult diffDraftAgainstPublished(String tipoLayout) {
        LayoutEditorState state = getEditorState(tipoLayout);
        List<String> draftLines = splitLines(state.html());
        List<String> publishedLines = splitLines(state.publishedHtml());
        int max = Math.max(draftLines.size(), publishedLines.size());
        List<LayoutDiffLine> diffLines = new java.util.ArrayList<>();

        for (int i = 0; i < max; i++) {
            String draftLine = i < draftLines.size() ? draftLines.get(i) : null;
            String publishedLine = i < publishedLines.size() ? publishedLines.get(i) : null;

            if (java.util.Objects.equals(draftLine, publishedLine)) {
                continue;
            }
            if (publishedLine != null && !publishedLine.isBlank()) {
                diffLines.add(new LayoutDiffLine("removed", publishedLine));
            }
            if (draftLine != null && !draftLine.isBlank()) {
                diffLines.add(new LayoutDiffLine("added", draftLine));
            }
            if (diffLines.size() >= 80) {
                diffLines.add(new LayoutDiffLine("info", "... diff truncado para manter legibilidade ..."));
                break;
            }
        }

        return new LayoutDiffResult(
                !diffLines.isEmpty(),
                draftLines.size(),
                publishedLines.size(),
                diffLines
        );
    }

    @Transactional
    public void resetPublishedLayout(String tipoLayout) {
        String normalizedType = normalizeType(tipoLayout);
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        archiveByStatus(empresaId, normalizedType, LayoutTemplateVersion.Status.DRAFT);
        archiveByStatus(empresaId, normalizedType, LayoutTemplateVersion.Status.PUBLISHED);

        LayoutTemplateVersion published = new LayoutTemplateVersion();
        published.setEmpresaId(empresaId);
        published.setTipoLayout(normalizedType);
        published.setVersionNumber(nextVersionNumber(empresaId, normalizedType));
        published.setStatus(LayoutTemplateVersion.Status.PUBLISHED);
        published.setHtmlContent(null);
        published.setCreatedBy(resolveActor());
        published.setPublishedBy(resolveActor());
        published.setPublishedAt(LocalDateTime.now());
        repository.save(published);

        updatePublishedConfig(normalizedType, null);
    }

    private LayoutVersionSummary publishFromSource(String tipoLayout, String html, LayoutTemplateVersion sourceVersion, String changeReason) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        archiveByStatus(empresaId, tipoLayout, LayoutTemplateVersion.Status.PUBLISHED);

        LayoutTemplateVersion published = new LayoutTemplateVersion();
        published.setEmpresaId(empresaId);
        published.setTipoLayout(tipoLayout);
        published.setVersionNumber(nextVersionNumber(empresaId, tipoLayout));
        published.setStatus(LayoutTemplateVersion.Status.PUBLISHED);
        published.setHtmlContent(html);
        published.setChangeReason(blankToNull(changeReason) != null ? blankToNull(changeReason) : sourceVersion.getChangeReason());
        published.setCreatedBy(resolveActor());
        published.setPublishedBy(resolveActor());
        published.setSourceVersionId(sourceVersion.getId());
        published.setPublishedAt(LocalDateTime.now());
        LayoutTemplateVersion savedPublished = repository.save(published);

        if (sourceVersion.getStatus() == LayoutTemplateVersion.Status.DRAFT) {
            sourceVersion.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
            repository.save(sourceVersion);
        }

        updatePublishedConfig(tipoLayout, html);
        return toSummary(savedPublished);
    }

    private void archiveByStatus(Long empresaId, String tipoLayout, LayoutTemplateVersion.Status status) {
        repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(empresaId, tipoLayout, status)
                .ifPresent(version -> {
                    version.setStatus(LayoutTemplateVersion.Status.ARCHIVED);
                    repository.save(version);
                });
    }

    private void updatePublishedConfig(String tipoLayout, String html) {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();

        switch (tipoLayout) {
            case "extratocliente" -> config.setLayoutHtmlExtratoCliente(html);
            case "extratofornecedor" -> config.setLayoutHtmlExtratoFornecedor(html);
            case "os" -> config.setLayoutHtmlOs(html);
            case "venda" -> config.setLayoutHtmlVenda(html);
            case "recibo" -> config.setLayoutHtmlRecibo(html);
            case "recibopagamento" -> config.setLayoutHtmlReciboPagamento(html);
            case "fechamentocaixa" -> config.setLayoutHtmlFechamentoCaixa(html);
            case "espelhonota" -> config.setLayoutHtmlEspelhoNota(html);
            case "dre" -> config.setLayoutHtmlDre(html);
            case "relatoriocomissao" -> config.setLayoutHtmlRelatorioComissao(html);
            case "relatoriocontaspagar" -> config.setLayoutHtmlRelatorioContasPagar(html);
            case "relatoriocontasreceber" -> config.setLayoutHtmlRelatorioContasReceber(html);
            default -> throw new IllegalArgumentException("Tipo de layout não encontrado: " + tipoLayout);
        }

        configuracaoService.atualizarConfiguracao(config);
    }

    private String readLayout(ConfiguracaoSistema config, String tipoLayout) {
        return switch (tipoLayout) {
            case "extratocliente" -> config.getLayoutHtmlExtratoCliente();
            case "extratofornecedor" -> config.getLayoutHtmlExtratoFornecedor();
            case "os" -> config.getLayoutHtmlOs();
            case "venda" -> config.getLayoutHtmlVenda();
            case "recibo" -> config.getLayoutHtmlRecibo();
            case "recibopagamento" -> config.getLayoutHtmlReciboPagamento();
            case "fechamentocaixa" -> config.getLayoutHtmlFechamentoCaixa();
            case "espelhonota" -> config.getLayoutHtmlEspelhoNota();
            case "dre" -> config.getLayoutHtmlDre();
            case "relatoriocomissao" -> config.getLayoutHtmlRelatorioComissao();
            case "relatoriocontaspagar" -> config.getLayoutHtmlRelatorioContasPagar();
            case "relatoriocontasreceber" -> config.getLayoutHtmlRelatorioContasReceber();
            default -> throw new IllegalArgumentException("Tipo de layout não encontrado: " + tipoLayout);
        };
    }

    private LayoutVersionSummary toSummary(LayoutTemplateVersion version) {
        return new LayoutVersionSummary(
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

    private Long nextVersionNumber(Long empresaId, String tipoLayout) {
        return repository.findFirstByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(empresaId, tipoLayout)
                .map(LayoutTemplateVersion::getVersionNumber)
                .orElse(0L) + 1L;
    }

    private String normalizeType(String tipoLayout) {
        governanceService.getMetadata(tipoLayout);
        return tipoLayout == null ? "" : tipoLayout.trim().toLowerCase();
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "sistema";
        }
        return authentication.getName();
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private List<String> splitLines(String html) {
        if (html == null || html.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(html.split("\\R"))
                .map(String::trim)
                .toList();
    }
}
