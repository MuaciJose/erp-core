package com.grandport.erp.modules.fiscal.service;

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
@DisplayName("Testes - Template Service do DANFE")
class DanfeTemplateServiceTest {

    private static final String JRXML_VALIDO_MINIMO = """
            <?xml version="1.0" encoding="UTF-8"?>
            <jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                          xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
                          name="danfe_teste"
                          pageWidth="595"
                          pageHeight="842"
                          columnWidth="555"
                          leftMargin="20"
                          rightMargin="20"
                          topMargin="20"
                          bottomMargin="20">
                <detail>
                    <band height="20"/>
                </detail>
            </jasperReport>
            """;

    @Mock
    private ConfiguracaoService configuracaoService;

    @InjectMocks
    private DanfeTemplateService service;

    @Test
    @DisplayName("Deve retornar JRXML customizado do banco quando configurado")
    void deveRetornarJrxmlCustomizadoDoBancoQuandoConfigurado() {
        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setLayoutJrxmlDanfe(JRXML_VALIDO_MINIMO);
        when(configuracaoService.obterConfiguracao()).thenReturn(config);

        String template = service.obterTemplateCompilavel();

        assertEquals(JRXML_VALIDO_MINIMO, template);
    }

    @Test
    @DisplayName("Deve rejeitar template sem tag jasperReport")
    void deveRejeitarTemplateSemTagJasperReport() {
        assertThrows(IllegalArgumentException.class, () -> service.validateTemplate("<html/>"));
    }
}
