package com.grandport.erp.modules.assinatura.controller;

import com.grandport.erp.modules.assinatura.dto.*;
import com.grandport.erp.modules.assinatura.service.AssinaturaService;
import com.grandport.erp.modules.assinatura.service.CobrancaAssinaturaService;
import com.grandport.erp.modules.assinatura.service.IncidenteEmpresaService;
import com.grandport.erp.modules.assinatura.service.LicenciamentoModuloService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Assinatura Controller")
class AssinaturaControllerTest {

    @Mock
    private AssinaturaService assinaturaService;

    @Mock
    private CobrancaAssinaturaService cobrancaAssinaturaService;

    @Mock
    private LicenciamentoModuloService licenciamentoModuloService;

    @Mock
    private IncidenteEmpresaService incidenteEmpresaService;

    @InjectMocks
    private AssinaturaController assinaturaController;

    @Test
    @DisplayName("GET /assinaturas/resumo-operacao deve retornar resumo da plataforma")
    void deveRetornarResumoOperacao() {
        SaasOperacaoResumoDTO dto = new SaasOperacaoResumoDTO(10, 7, 2, 1, 3, 1990.0, 390.0, 5, 2, 2, 4, 6, 2);
        when(assinaturaService.obterResumoOperacao()).thenReturn(dto);

        var response = assinaturaController.resumoOperacao();

        assertNotNull(response);
        assertEquals(10, response.totalEmpresas());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(assinaturaService).obterResumoOperacao();
    }

    @Test
    @DisplayName("GET /assinaturas/empresas/{id}/modulos deve retornar licenciamento")
    void deveListarModulosPorEmpresa() {
        when(licenciamentoModuloService.listarLicencasEmpresa(9L)).thenReturn(List.of(
                new ModuloLicencaResumoDTO("fiscal", "Fiscal", "Fiscal", false, true, "LIBERACAO_MANUAL", "Cortesia",
                        149.90, 99.90, true, "2026-04-30", false, null, "2026-04-02T09:00:00", "owner")
        ));

        var response = assinaturaController.listarModulosEmpresa(9L);

        assertEquals(1, response.size());
        assertEquals("fiscal", response.get(0).modulo());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(licenciamentoModuloService).listarLicencasEmpresa(9L);
    }

    @Test
    @DisplayName("GET /assinaturas/empresas/{id}/timeline deve retornar timeline da empresa")
    void deveListarTimelineEmpresa() {
        when(assinaturaService.listarTimelineEmpresa(5L)).thenReturn(List.of(
                new EmpresaTimelineEventoDTO("2026-04-02T09:00:00", "COBRANCA", "COBRANCA_PENDENTE", "Cobrança criada", "INFO", "BILLING")
        ));

        var response = assinaturaController.listarTimelineEmpresa(5L);

        assertEquals(1, response.size());
        assertEquals("COBRANCA", response.get(0).tipo());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(assinaturaService).listarTimelineEmpresa(5L);
    }

    @Test
    @DisplayName("POST /assinaturas/empresas/{id}/modulos deve atualizar módulo")
    void deveAtualizarModuloEmpresa() {
        AtualizarLicencaModuloDTO payload = new AtualizarLicencaModuloDTO("fiscal", true, "Liberado comercialmente", 129.90, "2026-04-15", false, null);
        when(licenciamentoModuloService.atualizarLicencaEmpresa(11L, payload)).thenReturn(List.of());

        var response = assinaturaController.atualizarModuloEmpresa(11L, payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(licenciamentoModuloService).atualizarLicencaEmpresa(11L, payload);
    }

    @Test
    @DisplayName("GET /assinaturas/empresas/{id}/incidentes deve listar incidentes da empresa")
    void deveListarIncidentesEmpresa() {
        when(incidenteEmpresaService.listarPorEmpresa(8L)).thenReturn(List.of(
                new EmpresaIncidenteDTO(1L, 8L, "OPERACIONAL", "Acesso indisponível", "ALTA", "ABERTO", "owner",
                        "2026-04-03", "2026-04-04", "Cliente sem acesso ao módulo fiscal", null,
                        "2026-04-02T10:00:00", "2026-04-02T10:30:00", "owner", "owner")
        ));

        var response = assinaturaController.listarIncidentesEmpresa(8L);

        assertEquals(1, response.size());
        assertEquals("Acesso indisponível", response.get(0).titulo());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(incidenteEmpresaService).listarPorEmpresa(8L);
    }

    @Test
    @DisplayName("POST /assinaturas/empresas/{id}/incidentes deve criar incidente")
    void deveCriarIncidenteEmpresa() {
        SalvarEmpresaIncidenteDTO payload = new SalvarEmpresaIncidenteDTO(
                "OPERACIONAL", "Módulo fiscal indisponível", "ALTA", "ABERTO", "owner",
                "2026-04-03", "2026-04-04", "Cliente sem acesso ao módulo", null
        );
        when(assinaturaService.usuarioAtual()).thenReturn("owner");
        when(incidenteEmpresaService.criar(8L, payload, "owner")).thenReturn(
                new EmpresaIncidenteDTO(1L, 8L, "OPERACIONAL", "Módulo fiscal indisponível", "ALTA", "ABERTO", "owner",
                        "2026-04-03", "2026-04-04", "Cliente sem acesso ao módulo", null,
                        "2026-04-02T10:00:00", "2026-04-02T10:00:00", "owner", "owner")
        );

        var response = assinaturaController.criarIncidenteEmpresa(8L, payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(assinaturaService).validarAcessoPlataforma();
        verify(assinaturaService).usuarioAtual();
        verify(incidenteEmpresaService).criar(8L, payload, "owner");
    }
}
