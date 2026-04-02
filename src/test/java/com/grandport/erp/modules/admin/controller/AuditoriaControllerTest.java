package com.grandport.erp.modules.admin.controller;

import com.grandport.erp.modules.admin.dto.LogAuditoriaResumoDTO;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Auditoria Controller")
class AuditoriaControllerTest {

    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private AuditoriaController auditoriaController;

    @Test
    @DisplayName("GET /auditoria deve repassar filtros para o service")
    void deveRepassarFiltrosParaOService() {
        var page = new PageImpl<>(List.of(
                new LogAuditoriaResumoDTO(
                        1L,
                        LocalDateTime.of(2026, 4, 2, 11, 30),
                        "Owner",
                        "SAAS",
                        "LICENCA_MODULO",
                        "Liberacao",
                        "127.0.0.1",
                        7L,
                        "Empresa Beta"
                )
        ));
        PageRequest pageable = PageRequest.of(1, 25);
        when(auditoriaService.listarFiltrado(
                7L,
                "SAAS",
                "LICENCA",
                "fiscal",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2),
                pageable
        )).thenReturn(page);

        var response = auditoriaController.getLogs(
                1,
                25,
                7L,
                "SAAS",
                "LICENCA",
                "fiscal",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2)
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        verify(auditoriaService).listarFiltrado(
                7L,
                "SAAS",
                "LICENCA",
                "fiscal",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2),
                pageable
        );
    }
}
