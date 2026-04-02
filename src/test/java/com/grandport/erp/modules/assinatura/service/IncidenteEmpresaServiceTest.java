package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.assinatura.dto.SalvarEmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.model.EmpresaIncidente;
import com.grandport.erp.modules.assinatura.repository.EmpresaIncidenteRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Incidente Empresa Service")
class IncidenteEmpresaServiceTest {

    @Mock
    private EmpresaIncidenteRepository empresaIncidenteRepository;

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private IncidenteEmpresaService incidenteEmpresaService;

    @Test
    @DisplayName("Deve criar incidente com SLA e operador")
    void deveCriarIncidenteComSlaEOperador() {
        Empresa empresa = new Empresa();
        empresa.setId(4L);

        SalvarEmpresaIncidenteDTO payload = new SalvarEmpresaIncidenteDTO(
                "OPERACIONAL",
                "Falha na emissão fiscal",
                "ALTA",
                "ABERTO",
                "owner",
                "2026-04-03",
                "2026-04-04",
                "Cliente não consegue emitir NF",
                null
        );

        when(empresaRepository.findById(4L)).thenReturn(Optional.of(empresa));
        when(empresaIncidenteRepository.save(any(EmpresaIncidente.class))).thenAnswer(invocation -> {
            EmpresaIncidente item = invocation.getArgument(0);
            item.setId(10L);
            return item;
        });

        var dto = incidenteEmpresaService.criar(4L, payload, "owner");

        assertEquals(10L, dto.id());
        assertEquals("Falha na emissão fiscal", dto.titulo());
        assertEquals("2026-04-04", dto.prazoResolucao());
        verify(empresaIncidenteRepository).save(any(EmpresaIncidente.class));
        verify(auditoriaService).registrar("SAAS", "INCIDENTE_EMPRESA", "Incidente criado para empresa 4: Falha na emissão fiscal");
    }

    @Test
    @DisplayName("Deve contar SLA vencido com data atual")
    void deveContarSlaVencido() {
        when(empresaIncidenteRepository.countSlaVencido(any(LocalDate.class))).thenReturn(3L);

        long total = incidenteEmpresaService.totalSlaVencido();

        assertEquals(3L, total);
        verify(empresaIncidenteRepository).countSlaVencido(any(LocalDate.class));
    }
}
