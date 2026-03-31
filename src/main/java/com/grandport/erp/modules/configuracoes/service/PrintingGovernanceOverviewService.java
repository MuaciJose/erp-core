package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateVersioningService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateVersioningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PrintingGovernanceOverviewService {

    private static final Logger log = LoggerFactory.getLogger(PrintingGovernanceOverviewService.class);

    private static final List<LayoutDefinition> HTML_LAYOUTS = List.of(
            new LayoutDefinition("extratoCliente", "Extrato de Cliente"),
            new LayoutDefinition("extratoFornecedor", "Extrato de Fornecedor"),
            new LayoutDefinition("os", "Ordem de Servico"),
            new LayoutDefinition("venda", "Pedido de Venda"),
            new LayoutDefinition("recibo", "Recibo"),
            new LayoutDefinition("reciboPagamento", "Recibo de Pagamento"),
            new LayoutDefinition("fechamentoCaixa", "Fechamento de Caixa"),
            new LayoutDefinition("espelhoNota", "Espelho de Nota"),
            new LayoutDefinition("dre", "DRE"),
            new LayoutDefinition("relatorioComissao", "Relatorio de Comissao"),
            new LayoutDefinition("relatorioContasPagar", "Relatorio de Contas a Pagar"),
            new LayoutDefinition("relatorioContasReceber", "Relatorio de Contas a Receber")
    );

    private final LayoutTemplateVersioningService layoutTemplateVersioningService;
    private final OfficialLayoutTemplateService officialLayoutTemplateService;
    private final LaudoVistoriaTemplateVersioningService laudoVistoriaTemplateVersioningService;
    private final LaudoVistoriaTemplateService laudoVistoriaTemplateService;
    private final DanfeTemplateVersioningService danfeTemplateVersioningService;
    private final DanfeTemplateService danfeTemplateService;

    public PrintingGovernanceOverviewService(
            LayoutTemplateVersioningService layoutTemplateVersioningService,
            OfficialLayoutTemplateService officialLayoutTemplateService,
            LaudoVistoriaTemplateVersioningService laudoVistoriaTemplateVersioningService,
            LaudoVistoriaTemplateService laudoVistoriaTemplateService,
            DanfeTemplateVersioningService danfeTemplateVersioningService,
            DanfeTemplateService danfeTemplateService
    ) {
        this.layoutTemplateVersioningService = layoutTemplateVersioningService;
        this.officialLayoutTemplateService = officialLayoutTemplateService;
        this.laudoVistoriaTemplateVersioningService = laudoVistoriaTemplateVersioningService;
        this.laudoVistoriaTemplateService = laudoVistoriaTemplateService;
        this.danfeTemplateVersioningService = danfeTemplateVersioningService;
        this.danfeTemplateService = danfeTemplateService;
    }

    public PrintingGovernanceOverview getOverview() {
        List<DocumentGovernanceStatus> htmlDocuments = HTML_LAYOUTS.stream()
                .map(definition -> safeBuildStatus(definition.tipo(), definition.label(), "html", () -> buildHtmlStatus(definition)))
                .toList();

        DocumentGovernanceStatus laudo = safeBuildStatus("laudoVistoriaJrxml", "Laudo de Vistoria", "jrxml", this::buildLaudoStatus);
        DocumentGovernanceStatus danfe = safeBuildStatus("danfeJrxml", "DANFE", "jrxml", this::buildDanfeStatus);

        long publishedOfficialCount = htmlDocuments.stream().filter(DocumentGovernanceStatus::publishedUsingOfficial).count()
                + (laudo.publishedUsingOfficial() ? 1 : 0)
                + (danfe.publishedUsingOfficial() ? 1 : 0);
        long publishedCustomCount = htmlDocuments.stream().filter(status -> !status.publishedUsingOfficial()).count()
                + (laudo.publishedUsingOfficial() ? 0 : 1)
                + (danfe.publishedUsingOfficial() ? 0 : 1);
        long draftsCount = htmlDocuments.stream().filter(DocumentGovernanceStatus::hasDraft).count()
                + (laudo.hasDraft() ? 1 : 0)
                + (danfe.hasDraft() ? 1 : 0);

        return new PrintingGovernanceOverview(
                htmlDocuments,
                laudo,
                danfe,
                htmlDocuments.size() + 2,
                publishedOfficialCount,
                publishedCustomCount,
                draftsCount
        );
    }

    private DocumentGovernanceStatus buildHtmlStatus(LayoutDefinition definition) {
        var state = layoutTemplateVersioningService.getEditorState(definition.tipo());
        var official = officialLayoutTemplateService.getOfficialTemplate(definition.tipo());

        return new DocumentGovernanceStatus(
                definition.tipo(),
                definition.label(),
                "html",
                state.hasDraft(),
                state.draftVersion(),
                state.publishedVersion(),
                safeEquals(state.html(), official.html()),
                safeEquals(state.publishedHtml(), official.html()),
                official.styleId(),
                false,
                null
        );
    }

    private DocumentGovernanceStatus buildLaudoStatus() {
        var state = laudoVistoriaTemplateVersioningService.getEditorState();
        var official = laudoVistoriaTemplateService.getOfficialTemplate();

        return new DocumentGovernanceStatus(
                "laudoVistoriaJrxml",
                "Laudo de Vistoria",
                "jrxml",
                state.hasDraft(),
                state.draftVersion(),
                state.publishedVersion(),
                safeEquals(state.jrxml(), official.jrxml()),
                safeEquals(state.publishedJrxml(), official.jrxml()),
                official.styleId(),
                false,
                null
        );
    }

    private DocumentGovernanceStatus buildDanfeStatus() {
        var state = danfeTemplateVersioningService.getEditorState();
        var official = danfeTemplateService.getOfficialTemplate();

        return new DocumentGovernanceStatus(
                "danfeJrxml",
                "DANFE",
                "jrxml",
                state.hasDraft(),
                state.draftVersion(),
                state.publishedVersion(),
                safeEquals(state.jrxml(), official.jrxml()),
                safeEquals(state.publishedJrxml(), official.jrxml()),
                official.styleId(),
                false,
                null
        );
    }

    private boolean safeEquals(String a, String b) {
        return a != null && a.equals(b);
    }

    private DocumentGovernanceStatus safeBuildStatus(
            String tipo,
            String label,
            String templateType,
            StatusSupplier supplier
    ) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("Falha ao montar status de governanca de impressao para {}.", tipo, e);
            return new DocumentGovernanceStatus(
                    tipo,
                    label,
                    templateType,
                    false,
                    null,
                    null,
                    false,
                    false,
                    null,
                    true,
                    e.getMessage()
            );
        }
    }

    private record LayoutDefinition(String tipo, String label) {}

    @FunctionalInterface
    private interface StatusSupplier {
        DocumentGovernanceStatus get();
    }

    public record DocumentGovernanceStatus(
            String tipo,
            String label,
            String templateType,
            boolean hasDraft,
            Long draftVersion,
            Long publishedVersion,
            boolean editorUsingOfficial,
            boolean publishedUsingOfficial,
            String officialStyleId,
            boolean errored,
            String errorMessage
    ) {}

    public record PrintingGovernanceOverview(
            List<DocumentGovernanceStatus> documents,
            DocumentGovernanceStatus laudo,
            DocumentGovernanceStatus danfe,
            int totalDocuments,
            long publishedOfficialCount,
            long publishedCustomCount,
            long draftsCount
    ) {}
}
