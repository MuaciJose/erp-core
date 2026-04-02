package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.dto.InsightDTO;
import com.grandport.erp.modules.financeiro.service.DashboardService;
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
@DisplayName("Testes - Dashboard Controller")
class DashboardControllerTest {

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardController dashboardController;

    @Test
    @DisplayName("GET /dashboard/resumo deve usar periodo informado")
    void deveBuscarResumoComPeriodoInformado() {
        DashboardResumoDTO dto = new DashboardResumoDTO();
        when(dashboardService.getResumoDashboard("7D")).thenReturn(dto);

        var response = dashboardController.getResumo("7D");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(dashboardService).getResumoDashboard("7D");
    }

    @Test
    @DisplayName("GET /dashboard/insights deve retornar lista do service")
    void deveBuscarInsights() {
        when(dashboardService.getInsightsInteligentes())
                .thenReturn(List.of(new InsightDTO("TIPO", "Titulo", "Mensagem", "Acao", "blue")));

        var response = dashboardController.getInsights();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(dashboardService).getInsightsInteligentes();
    }
}
