package com.grandport.erp.modules.atendimento.controller;

import com.grandport.erp.modules.atendimento.dto.AtendimentoTemplateDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoTicketDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoResumoDTO;
import com.grandport.erp.modules.atendimento.dto.AtualizarAtendimentoStatusDTO;
import com.grandport.erp.modules.atendimento.dto.SalvarAtendimentoTemplateDTO;
import com.grandport.erp.modules.atendimento.service.AtendimentoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Atendimento Controller")
class AtendimentoControllerTest {

    @Mock
    private AtendimentoService atendimentoService;

    @InjectMocks
    private AtendimentoController atendimentoController;

    @Test
    @DisplayName("GET /atendimentos/plataforma/tickets deve listar inbox da plataforma")
    void deveListarTicketsDaPlataforma() {
        when(atendimentoService.listarTicketsPlataforma("ABERTO", "oficina")).thenReturn(List.of(
                new AtendimentoTicketDTO(1L, 7L, "Oficina Modelo", "Sem acesso", "OPERACIONAL", "ALTA",
                        "ABERTO", "Cliente", "Owner", 9L, "Incidente fiscal", "ABERTO", "ALTA", "2026-04-03", "2026-04-04", "2026-04-02T12:00:00",
                        "PLATAFORMA", "Owner", "owner.admin", "PLATFORM_ADMIN",
                        "2026-04-02T10:00:00", "2026-04-02T12:00:00", null)
        ));

        var response = atendimentoController.listarTicketsPlataforma("ABERTO", "oficina");

        assertEquals(1, response.size());
        assertEquals(9L, response.get(0).incidenteId());
        verify(atendimentoService).listarTicketsPlataforma("ABERTO", "oficina");
    }

    @Test
    @DisplayName("POST /atendimentos/plataforma/tickets/{id}/status deve atualizar incidente vinculado")
    void deveAtualizarStatusDoTicket() {
        AtualizarAtendimentoStatusDTO payload = new AtualizarAtendimentoStatusDTO("EM_ATENDIMENTO", "Owner", 33L);
        when(atendimentoService.atualizarStatusPlataforma(4L, payload)).thenReturn(
                new AtendimentoTicketDTO(4L, 7L, "Oficina Modelo", "Sem acesso", "OPERACIONAL", "ALTA",
                        "EM_ATENDIMENTO", "Cliente", "Owner", 33L, "Incidente fiscal", "EM_ATENDIMENTO", "ALTA", "2026-04-03", "2026-04-04", "2026-04-02T12:00:00",
                        "PLATAFORMA", "Owner", "owner.admin", "PLATFORM_ADMIN",
                        "2026-04-02T10:00:00", "2026-04-02T12:00:00", null)
        );

        var response = atendimentoController.atualizarStatusTicket(4L, payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(atendimentoService).atualizarStatusPlataforma(4L, payload);
    }

    @Test
    @DisplayName("GET /atendimentos/plataforma/templates deve listar templates")
    void deveListarTemplatesDaPlataforma() {
        when(atendimentoService.listarTemplatesPlataforma()).thenReturn(List.of(
                new AtendimentoTemplateDTO(1L, "Recebimento", "Recebemos seu atendimento.", "2026-04-02T15:00:00", "2026-04-02T15:00:00", "Owner")
        ));

        var response = atendimentoController.listarTemplatesPlataforma();

        assertEquals(1, response.size());
        assertEquals("Recebimento", response.get(0).titulo());
        verify(atendimentoService).listarTemplatesPlataforma();
    }

    @Test
    @DisplayName("GET /atendimentos/plataforma/resumo deve retornar metricas do suporte")
    void deveRetornarResumoDaPlataforma() {
        when(atendimentoService.resumoPlataforma()).thenReturn(
                new AtendimentoResumoDTO(4, 2, 1, 3, 8, 17)
        );

        var response = atendimentoController.resumoPlataforma();

        assertEquals(4, response.aguardandoPlataforma());
        assertEquals(17, response.tempoMedioPrimeiraRespostaMinutos());
        verify(atendimentoService).resumoPlataforma();
    }

    @Test
    @DisplayName("POST /atendimentos/plataforma/templates deve criar template")
    void deveCriarTemplateDaPlataforma() {
        SalvarAtendimentoTemplateDTO payload = new SalvarAtendimentoTemplateDTO("Ajuste aplicado", "Valide novamente o fluxo.");
        when(atendimentoService.criarTemplatePlataforma(payload)).thenReturn(
                new AtendimentoTemplateDTO(2L, "Ajuste aplicado", "Valide novamente o fluxo.", "2026-04-02T15:00:00", "2026-04-02T15:00:00", "Owner")
        );

        var response = atendimentoController.criarTemplatePlataforma(payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(atendimentoService).criarTemplatePlataforma(payload);
    }
}
