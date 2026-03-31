package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateVersioningService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateVersioningService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Overview de Governanca de Impressao")
class PrintingGovernanceOverviewServiceTest {

    @Mock
    private LayoutTemplateVersioningService layoutTemplateVersioningService;

    @Mock
    private OfficialLayoutTemplateService officialLayoutTemplateService;

    @Mock
    private LaudoVistoriaTemplateVersioningService laudoVistoriaTemplateVersioningService;

    @Mock
    private LaudoVistoriaTemplateService laudoVistoriaTemplateService;

    @Mock
    private DanfeTemplateVersioningService danfeTemplateVersioningService;

    @Mock
    private DanfeTemplateService danfeTemplateService;

    @InjectMocks
    private PrintingGovernanceOverviewService service;

    @Test
    @DisplayName("Deve agregar contadores de oficiais, customizados e drafts")
    void deveAgregarContadoresDeOficiaisCustomizadosEDrafts() {
        when(layoutTemplateVersioningService.getEditorState("os"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("os", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("venda"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("venda", "ALTERADO", "ALTERADO", true, 3L, 2L));
        when(layoutTemplateVersioningService.getEditorState("extratoCliente"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("extratoCliente", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("extratoFornecedor"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("extratoFornecedor", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("recibo"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("recibo", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("reciboPagamento"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("reciboPagamento", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("fechamentoCaixa"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("fechamentoCaixa", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("espelhoNota"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("espelhoNota", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("dre"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("dre", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("relatorioComissao"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("relatorioComissao", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("relatorioContasPagar"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("relatorioContasPagar", "OFICIAL", "OFICIAL", false, null, 1L));
        when(layoutTemplateVersioningService.getEditorState("relatorioContasReceber"))
                .thenReturn(new LayoutTemplateVersioningService.LayoutEditorState("relatorioContasReceber", "OFICIAL", "OFICIAL", false, null, 1L));

        when(officialLayoutTemplateService.getOfficialTemplate("os"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "03-automotivo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("venda"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("extratoCliente"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("extratoFornecedor"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("recibo"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "01-executivo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("reciboPagamento"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("fechamentoCaixa"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "03-automotivo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("espelhoNota"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("dre"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("relatorioComissao"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "01-executivo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("relatorioContasPagar"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));
        when(officialLayoutTemplateService.getOfficialTemplate("relatorioContasReceber"))
                .thenReturn(new OfficialLayoutTemplateService.OfficialTemplatePayload("OFICIAL", "02-corporativo", "Oficial"));

        when(laudoVistoriaTemplateVersioningService.getEditorState())
                .thenReturn(new LaudoVistoriaTemplateVersioningService.EditorState("JRXML-OFICIAL", "JRXML-OFICIAL", false, false, null, 1L));
        when(laudoVistoriaTemplateService.getOfficialTemplate())
                .thenReturn(new LaudoVistoriaTemplateService.OfficialLaudoTemplatePayload("JRXML-OFICIAL", "01-executivo", "Oficial"));

        when(danfeTemplateVersioningService.getEditorState())
                .thenReturn(new DanfeTemplateVersioningService.EditorState("DANFE-OFICIAL", "DANFE-CUSTOM", true, true, 4L, 2L));
        when(danfeTemplateService.getOfficialTemplate())
                .thenReturn(new DanfeTemplateService.OfficialDanfeTemplatePayload("DANFE-OFICIAL", "02-corporativo", "Oficial"));

        var overview = service.getOverview();

        assertEquals(14, overview.totalDocuments());
        assertEquals(12, overview.publishedOfficialCount());
        assertEquals(2, overview.publishedCustomCount());
        assertEquals(2, overview.draftsCount());
        assertTrue(overview.documents().stream().anyMatch(document -> "os".equals(document.tipo())));
        assertEquals("DANFE", overview.danfe().label());
    }
}
