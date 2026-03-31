package com.grandport.erp.modules.checklist.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Template Service do Laudo")
class LaudoVistoriaTemplateServiceTest {

    @Mock
    private ConfiguracaoService configuracaoService;

    @InjectMocks
    private LaudoVistoriaTemplateService service;

    @Test
    @DisplayName("Deve retornar JRXML customizado do banco quando configurado")
    void deveRetornarJrxmlCustomizadoDoBancoQuandoConfigurado() {
        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setLayoutJrxmlLaudoVistoria("<jasperReport>custom</jasperReport>");
        when(configuracaoService.obterConfiguracao()).thenReturn(config);

        var state = service.obterTemplateAtual();

        assertEquals("<jasperReport>custom</jasperReport>", state.jrxml());
        assertEquals(true, state.customizado());
    }

    @Test
    @DisplayName("Deve rejeitar template sem tag jasperReport")
    void deveRejeitarTemplateSemTagJasperReport() {
        assertThrows(IllegalArgumentException.class, () -> service.validateTemplate("<html/>"));
    }
}
