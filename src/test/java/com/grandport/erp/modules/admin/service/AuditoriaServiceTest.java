package com.grandport.erp.modules.admin.service;

import com.grandport.erp.modules.admin.dto.LogAuditoriaResumoDTO;
import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Auditoria Service")
class AuditoriaServiceTest {

    @Mock
    private LogAuditoriaRepository repository;

    @Mock
    private EmpresaContextService empresaContextService;

    @Mock
    private EmpresaRepository empresaRepository;

    @InjectMocks
    private AuditoriaService auditoriaService;

    @Test
    @DisplayName("Deve listar auditoria filtrada normalizando filtros e mapeando nomes das empresas")
    void deveListarAuditoriaFiltradaNormalizandoFiltrosEMapeandoEmpresas() {
        LogAuditoria logEmpresa = new LogAuditoria();
        logEmpresa.setId(1L);
        logEmpresa.setEmpresaId(9L);
        logEmpresa.setDataHora(LocalDateTime.of(2026, 4, 2, 10, 15));
        logEmpresa.setUsuarioNome("Operador");
        logEmpresa.setModulo("SAAS");
        logEmpresa.setAcao("LICENCA_MODULO");
        logEmpresa.setDetalhes("Liberacao de modulo fiscal");
        logEmpresa.setIpOrigem("127.0.0.1");

        LogAuditoria logPlataforma = new LogAuditoria();
        logPlataforma.setId(2L);
        logPlataforma.setEmpresaId(null);
        logPlataforma.setDataHora(LocalDateTime.of(2026, 4, 2, 11, 0));
        logPlataforma.setUsuarioNome("SYSTEM");
        logPlataforma.setModulo("BILLING");
        logPlataforma.setAcao("COBRANCA");
        logPlataforma.setDetalhes("Processamento interno");
        logPlataforma.setIpOrigem("SISTEMA_INTERNO");

        Empresa empresa = new Empresa();
        empresa.setId(9L);
        empresa.setRazaoSocial("Empresa Alpha");

        PageRequest pageable = PageRequest.of(0, 20);

        when(repository.buscarFiltrado(
                9L,
                "SAAS",
                "LICENCA",
                "fiscal",
                LocalDate.of(2026, 4, 1).atStartOfDay(),
                LocalDate.of(2026, 4, 3).atStartOfDay(),
                pageable
        )).thenReturn(new PageImpl<>(List.of(logEmpresa, logPlataforma), pageable, 2));
        when(empresaRepository.findAllById(anyIterable())).thenReturn(List.of(empresa));

        var pagina = auditoriaService.listarFiltrado(
                9L,
                "  SAAS  ",
                " LICENCA ",
                " fiscal ",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 4, 2),
                pageable
        );

        assertEquals(2, pagina.getTotalElements());
        LogAuditoriaResumoDTO primeiro = pagina.getContent().get(0);
        LogAuditoriaResumoDTO segundo = pagina.getContent().get(1);
        assertEquals("Empresa Alpha", primeiro.empresaRazaoSocial());
        assertEquals("PLATAFORMA", segundo.empresaRazaoSocial());
        assertNotNull(primeiro.dataHora());

        verify(repository).buscarFiltrado(
                9L,
                "SAAS",
                "LICENCA",
                "fiscal",
                LocalDate.of(2026, 4, 1).atStartOfDay(),
                LocalDate.of(2026, 4, 3).atStartOfDay(),
                pageable
        );
        verify(empresaRepository).findAllById(anyIterable());
    }
}
