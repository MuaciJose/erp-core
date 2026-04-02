package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.model.SecurityEvent;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.admin.repository.SecurityEventRepository;
import com.grandport.erp.modules.assinatura.dto.EmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.model.CobrancaStatus;
import com.grandport.erp.modules.assinatura.repository.AssinaturaInviteRepository;
import com.grandport.erp.modules.assinatura.repository.SolicitacaoAcessoRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Assinatura Service")
class AssinaturaServiceTest {

    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private PasswordPolicyService passwordPolicyService;
    @Mock
    private AssinaturaInviteRepository assinaturaInviteRepository;
    @Mock
    private SolicitacaoAcessoRepository solicitacaoAcessoRepository;
    @Mock
    private CobrancaAssinaturaService cobrancaAssinaturaService;
    @Mock
    private LicenciamentoModuloService licenciamentoModuloService;
    @Mock
    private IncidenteEmpresaService incidenteEmpresaService;
    @Mock
    private LogAuditoriaRepository logAuditoriaRepository;
    @Mock
    private SecurityEventRepository securityEventRepository;

    @InjectMocks
    private AssinaturaService assinaturaService;

    @Test
    @DisplayName("Timeline da empresa deve incluir incidentes ordenados junto com auditoria, seguranca e cobranca")
    void deveListarTimelineEmpresaComIncidentes() {
        Empresa empresa = new Empresa();
        empresa.setId(15L);
        when(empresaRepository.findById(15L)).thenReturn(Optional.of(empresa));

        LogAuditoria auditoria = new LogAuditoria();
        auditoria.setDataHora(LocalDateTime.parse("2026-04-02T09:00:00"));
        auditoria.setAcao("LICENCA_ATUALIZADA");
        auditoria.setDetalhes("Modulo fiscal liberado");
        auditoria.setModulo("SAAS");
        when(logAuditoriaRepository.findTop20ByEmpresaIdOrderByDataHoraDesc(15L)).thenReturn(List.of(auditoria));

        SecurityEvent securityEvent = new SecurityEvent();
        securityEvent.setDataHora(LocalDateTime.parse("2026-04-02T10:00:00"));
        securityEvent.setTipo("LOGIN_MFA");
        securityEvent.setDetalhes("MFA validado");
        securityEvent.setSeveridade("INFO");
        when(securityEventRepository.findTop20ByEmpresaIdOrderByDataHoraDesc(15L)).thenReturn(List.of(securityEvent));

        AssinaturaCobranca cobranca = new AssinaturaCobranca();
        cobranca.setCreatedAt(LocalDateTime.parse("2026-04-02T08:30:00"));
        cobranca.setReferencia("MENSALIDADE-2026-04");
        cobranca.setValor(new BigDecimal("149.90"));
        cobranca.setStatus(CobrancaStatus.PENDENTE);
        when(cobrancaAssinaturaService.listarEntidadesPorEmpresa(15L)).thenReturn(List.of(cobranca));

        when(incidenteEmpresaService.listarPorEmpresa(15L)).thenReturn(List.of(
                new EmpresaIncidenteDTO(
                        1L, 15L, "OPERACIONAL", "ERP indisponível", "CRITICA", "ABERTO", "owner",
                        "2026-04-02", "2026-04-03", "Cliente sem acesso ao painel", null,
                        "2026-04-02T07:30:00", "2026-04-02T11:00:00", "owner", "owner"
                )
        ));

        var timeline = assinaturaService.listarTimelineEmpresa(15L);

        assertEquals(4, timeline.size());
        assertEquals("INCIDENTE", timeline.get(0).tipo());
        assertTrue(timeline.get(0).titulo().contains("ERP indisponível"));
        assertTrue(timeline.get(0).descricao().contains("SLA resolução: 2026-04-03"));
        assertEquals("SEGURANCA", timeline.get(1).tipo());
        assertEquals("AUDITORIA", timeline.get(2).tipo());
        assertEquals("COBRANCA", timeline.get(3).tipo());
    }
}
