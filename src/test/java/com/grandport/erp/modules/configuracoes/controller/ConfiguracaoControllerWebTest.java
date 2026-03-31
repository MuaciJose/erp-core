package com.grandport.erp.modules.configuracoes.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grandport.erp.modules.checklist.service.ChecklistService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateService;
import com.grandport.erp.modules.checklist.service.LaudoVistoriaTemplateVersioningService;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.configuracoes.service.LayoutPreviewDataService;
import com.grandport.erp.modules.configuracoes.service.LayoutTemplateGovernanceService;
import com.grandport.erp.modules.configuracoes.service.LayoutTemplateVersioningService;
import com.grandport.erp.modules.configuracoes.service.ManutencaoService;
import com.grandport.erp.modules.configuracoes.service.OfficialLayoutTemplateService;
import com.grandport.erp.modules.configuracoes.service.PremiumTemplateLibraryService;
import com.grandport.erp.modules.configuracoes.service.PrintingGovernanceOverviewService;
import com.grandport.erp.modules.fiscal.service.DanfeService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateService;
import com.grandport.erp.modules.fiscal.service.DanfeTemplateVersioningService;
import com.grandport.erp.modules.pdf.service.PdfService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Web - Configuracao Controller")
class ConfiguracaoControllerWebTest {

    @Mock
    private ConfiguracaoService configuracaoService;
    @Mock
    private LayoutTemplateGovernanceService layoutTemplateGovernanceService;
    @Mock
    private LayoutPreviewDataService layoutPreviewDataService;
    @Mock
    private OfficialLayoutTemplateService officialLayoutTemplateService;
    @Mock
    private PremiumTemplateLibraryService premiumTemplateLibraryService;
    @Mock
    private PdfService pdfService;
    @Mock
    private LayoutTemplateVersioningService layoutTemplateVersioningService;
    @Mock
    private ManutencaoService manutencaoService;
    @Mock
    private PrintingGovernanceOverviewService printingGovernanceOverviewService;
    @Mock
    private LaudoVistoriaTemplateService laudoVistoriaTemplateService;
    @Mock
    private LaudoVistoriaService laudoVistoriaService;
    @Mock
    private LaudoVistoriaTemplateVersioningService laudoVistoriaTemplateVersioningService;
    @Mock
    private ChecklistService checklistService;
    @Mock
    private DanfeTemplateService danfeTemplateService;
    @Mock
    private DanfeTemplateVersioningService danfeTemplateVersioningService;
    @Mock
    private DanfeService danfeService;

    @InjectMocks
    private ConfiguracaoController configuracaoController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(configuracaoController).build();
    }

    @Test
    @DisplayName("GET /api/configuracoes/layouts/overview deve retornar resumo de governança")
    void deveRetornarResumoGovernanca() throws Exception {
        var documento = new PrintingGovernanceOverviewService.DocumentGovernanceStatus(
                "extratoCliente", "Extrato de Cliente", "html",
                true, 3L, 2L, false, true, "02-corporativo", false, null
        );
        var laudo = new PrintingGovernanceOverviewService.DocumentGovernanceStatus(
                "laudoVistoriaJrxml", "Laudo de Vistoria", "jrxml",
                false, null, 1L, true, true, "01-executivo", false, null
        );
        var danfe = new PrintingGovernanceOverviewService.DocumentGovernanceStatus(
                "danfeJrxml", "DANFE", "jrxml",
                false, null, 1L, true, true, "02-corporativo", false, null
        );
        var overview = new PrintingGovernanceOverviewService.PrintingGovernanceOverview(
                List.of(documento), laudo, danfe, 3, 2, 1, 1
        );

        when(printingGovernanceOverviewService.getOverview()).thenReturn(overview);

        mockMvc.perform(get("/api/configuracoes/layouts/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDocuments").value(3))
                .andExpect(jsonPath("$.publishedOfficialCount").value(2))
                .andExpect(jsonPath("$.documents[0].tipo").value("extratoCliente"))
                .andExpect(jsonPath("$.laudo.label").value("Laudo de Vistoria"))
                .andExpect(jsonPath("$.danfe.officialStyleId").value("02-corporativo"));
    }

    @Test
    @DisplayName("GET /api/configuracoes/layouts/{tipo}/library/{style}/preview-pdf deve retornar PDF")
    void deveGerarPreviewPdfDaBibliotecaHtml() throws Exception {
        when(premiumTemplateLibraryService.getHtmlTemplate("extratoCliente", "01-executivo"))
                .thenReturn(new PremiumTemplateLibraryService.TemplateLibraryContent(
                        "01-executivo", "Executivo", "<html><body>ok</body></html>", false
                ));
        when(layoutPreviewDataService.buildPreviewVariables("extratoCliente"))
                .thenReturn(Map.of("empresa", Map.of("nomeFantasia", "GrandPort")));
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap()))
                .thenReturn("pdf-html".getBytes());

        mockMvc.perform(get("/api/configuracoes/layouts/extratoCliente/library/01-executivo/preview-pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "inline; filename=preview-library-extratoCliente-01-executivo.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes("pdf-html".getBytes()));
    }

    @Test
    @DisplayName("POST /api/configuracoes/layouts/{tipo}/preview-pdf deve rejeitar HTML vazio")
    void deveRejeitarPreviewComHtmlVazio() throws Exception {
        mockMvc.perform(post("/api/configuracoes/layouts/extratoCliente/preview-pdf")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("html", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("HTML não pode estar vazio"));
    }

    @Test
    @DisplayName("GET /api/configuracoes/laudo-vistoria/template/library/{style}/preview deve retornar PDF")
    void deveGerarPreviewPdfDaBibliotecaDoLaudo() throws Exception {
        when(premiumTemplateLibraryService.getLaudoTemplate("01-executivo"))
                .thenReturn(new PremiumTemplateLibraryService.TemplateLibraryContent(
                        "01-executivo", "Executivo", "<jasperReport/>", true
                ));
        when(laudoVistoriaService.gerarPreviewPdfComTemplate("<jasperReport/>", 15L))
                .thenReturn("pdf-laudo".getBytes());

        mockMvc.perform(get("/api/configuracoes/laudo-vistoria/template/library/01-executivo/preview")
                        .param("checklistId", "15"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "inline; filename=preview-library-laudo-01-executivo.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes("pdf-laudo".getBytes()));
    }

    @Test
    @DisplayName("GET /api/configuracoes/danfe/template/library deve listar estilos da biblioteca")
    void deveListarBibliotecaDoDanfe() throws Exception {
        when(premiumTemplateLibraryService.listDanfeTemplates())
                .thenReturn(List.of(
                        new PremiumTemplateLibraryService.TemplateLibraryItem("02-corporativo", "Corporativo", true),
                        new PremiumTemplateLibraryService.TemplateLibraryItem("03-automotivo", "Automotivo", false)
                ));

        mockMvc.perform(get("/api/configuracoes/danfe/template/library"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].styleId").value("02-corporativo"))
                .andExpect(jsonPath("$[0].official").value(true))
                .andExpect(jsonPath("$[1].label").value("Automotivo"));
    }

    @Test
    @DisplayName("GET /api/configuracoes/danfe/template/library/{style}/preview deve retornar PDF")
    void deveGerarPreviewPdfDaBibliotecaDoDanfe() throws Exception {
        when(premiumTemplateLibraryService.getDanfeTemplate("02-corporativo"))
                .thenReturn(new PremiumTemplateLibraryService.TemplateLibraryContent(
                        "02-corporativo", "Corporativo", "<jasperReport/>", true
                ));
        when(danfeService.gerarPreviewDanfePdf("<jasperReport/>"))
                .thenReturn("pdf-danfe".getBytes());

        mockMvc.perform(get("/api/configuracoes/danfe/template/library/02-corporativo/preview"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "inline; filename=preview-library-danfe-02-corporativo.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes("pdf-danfe".getBytes()));
    }
}
