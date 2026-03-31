package com.grandport.erp.modules.fiscal.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.model.LayoutTemplateVersion;
import com.grandport.erp.modules.configuracoes.repository.LayoutTemplateVersionRepository;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Versionamento do DANFE")
class DanfeTemplateVersioningServiceTest {

    @Mock
    private LayoutTemplateVersionRepository repository;

    @Mock
    private ConfiguracaoService configuracaoService;

    @Mock
    private EmpresaContextService empresaContextService;

    @Mock
    private DanfeTemplateService templateService;

    @InjectMocks
    private DanfeTemplateVersioningService service;

    private ConfiguracaoSistema configuracao;

    @BeforeEach
    void setUp() {
        configuracao = new ConfiguracaoSistema();
        configuracao.setEmpresaId(7L);
        configuracao.setLayoutJrxmlDanfe("<jasperReport>publicado-danfe</jasperReport>");

        when(empresaContextService.getRequiredEmpresaId()).thenReturn(7L);
        lenient().when(configuracaoService.obterConfiguracao()).thenReturn(configuracao);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );
    }

    @Test
    @DisplayName("Deve retornar diff entre draft e publicado")
    void deveRetornarDiffEntreDraftEPublicado() {
        LayoutTemplateVersion draft = new LayoutTemplateVersion();
        draft.setVersionNumber(3L);
        draft.setStatus(LayoutTemplateVersion.Status.DRAFT);
        draft.setHtmlContent("<jasperReport>\nnovo-danfe\n</jasperReport>");

        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.DRAFT
        )).thenReturn(Optional.of(draft));
        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.PUBLISHED
        )).thenReturn(Optional.empty());

        var diff = service.diffDraftAgainstPublished();

        assertTrue(diff.hasChanges());
        assertEquals(3, diff.draftLineCount());
        assertEquals(3, diff.lines().stream().filter(line -> "added".equals(line.type())).count());
    }

    @Test
    @DisplayName("Deve salvar draft do DANFE com motivo")
    void deveSalvarDraftDoDanfeComMotivo() {
        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.DRAFT
        )).thenReturn(Optional.empty());
        when(repository.findFirstByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(7L, "danfejrxml"))
                .thenReturn(Optional.empty());
        when(repository.save(any(LayoutTemplateVersion.class))).thenAnswer(invocation -> {
            LayoutTemplateVersion version = invocation.getArgument(0);
            version.setId(10L);
            return version;
        });

        var resultado = service.saveDraft("<jasperReport>draft-danfe</jasperReport>", "Ajuste do cabecalho");

        assertEquals("DRAFT", resultado.status());
        assertEquals("Ajuste do cabecalho", resultado.changeReason());
        assertEquals("admin", resultado.createdBy());
        verify(templateService).validateTemplate("<jasperReport>draft-danfe</jasperReport>");
    }

    @Test
    @DisplayName("Deve publicar draft e atualizar configuracao")
    void devePublicarDraftEAtualizarConfiguracao() {
        LayoutTemplateVersion draft = new LayoutTemplateVersion();
        draft.setId(12L);
        draft.setVersionNumber(2L);
        draft.setStatus(LayoutTemplateVersion.Status.DRAFT);
        draft.setHtmlContent("<jasperReport>draft-danfe</jasperReport>");
        draft.setChangeReason("Atualizacao visual");

        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.DRAFT
        )).thenReturn(Optional.of(draft));
        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.PUBLISHED
        )).thenReturn(Optional.empty());
        when(repository.findFirstByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(7L, "danfejrxml"))
                .thenReturn(Optional.of(draft));
        when(repository.save(any(LayoutTemplateVersion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = service.publishDraft("Publicacao inicial");

        assertEquals("PUBLISHED", resultado.status());
        assertEquals("Publicacao inicial", resultado.changeReason());
        assertEquals("<jasperReport>draft-danfe</jasperReport>", configuracao.getLayoutJrxmlDanfe());
        verify(configuracaoService).atualizarConfiguracao(configuracao);
    }

    @Test
    @DisplayName("Deve retornar template publicado quando nao existir draft")
    void deveRetornarTemplatePublicadoQuandoNaoExistirDraft() {
        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.DRAFT
        )).thenReturn(Optional.empty());
        when(repository.findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
                7L, "danfejrxml", LayoutTemplateVersion.Status.PUBLISHED
        )).thenReturn(Optional.empty());

        var state = service.getEditorState();

        assertFalse(state.hasDraft());
        assertEquals("<jasperReport>publicado-danfe</jasperReport>", state.jrxml());
    }
}
