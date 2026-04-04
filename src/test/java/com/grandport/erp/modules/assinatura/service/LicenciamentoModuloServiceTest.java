package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.assinatura.model.LicencaModuloEmpresa;
import com.grandport.erp.modules.assinatura.repository.PlanoSaasModuloRepository;
import com.grandport.erp.modules.assinatura.repository.PlanoSaasRepository;
import com.grandport.erp.modules.assinatura.repository.LicencaModuloEmpresaRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Licenciamento Modulo Service")
class LicenciamentoModuloServiceTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private LicencaModuloEmpresaRepository licencaModuloEmpresaRepository;

    @Mock
    private AuditoriaService auditoriaService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PlanoSaasRepository planoSaasRepository;

    @Mock
    private PlanoSaasModuloRepository planoSaasModuloRepository;

    @InjectMocks
    private LicenciamentoModuloService licenciamentoModuloService;

    @Test
    @DisplayName("Deve expirar trial vencido de módulo extra")
    void deveExpirarTrialVencidoDeModuloExtra() {
        Empresa empresa = new Empresa();
        empresa.setId(3L);
        empresa.setPlano("ESSENCIAL");

        LicencaModuloEmpresa licenca = new LicencaModuloEmpresa();
        licenca.setEmpresaId(3L);
        licenca.setModulo("fiscal");
        licenca.setAtivo(true);
        licenca.setTrialAte(LocalDate.now().minusDays(1));

        when(licencaModuloEmpresaRepository.findByAtivoTrueAndTrialAteBefore(any(LocalDate.class))).thenReturn(List.of(licenca));
        when(empresaRepository.findById(3L)).thenReturn(Optional.of(empresa));
        when(planoSaasRepository.findByCodigoIgnoreCase(anyString())).thenReturn(Optional.empty());

        int expirados = licenciamentoModuloService.expirarTrialsVencidos();

        assertEquals(1, expirados);
        assertEquals(false, licenca.getAtivo());
        verify(licencaModuloEmpresaRepository).save(licenca);
    }

    @Test
    @DisplayName("Deve bloquear add-on por inadimplência")
    void deveBloquearAddonPorInadimplencia() {
        LicencaModuloEmpresa licenca = new LicencaModuloEmpresa();
        licenca.setEmpresaId(4L);
        licenca.setModulo("whatsapp");
        licenca.setAtivo(true);
        licenca.setValorMensalExtra(new BigDecimal("39.90"));
        licenca.setBloqueadoComercial(false);

        when(licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(4L)).thenReturn(List.of(licenca));

        int bloqueados = licenciamentoModuloService.bloquearAddonsPorInadimplencia(4L, "Bloqueio automático por inadimplência de add-ons. Vencimento em 2026-04-01.");

        assertEquals(1, bloqueados);
        assertEquals(true, licenca.getBloqueadoComercial());
        verify(licencaModuloEmpresaRepository).save(licenca);
    }

    @Test
    @DisplayName("Deve liberar bloqueio automático após pagamento")
    void deveLiberarBloqueioAutomaticoAposPagamento() {
        LicencaModuloEmpresa licenca = new LicencaModuloEmpresa();
        licenca.setEmpresaId(4L);
        licenca.setModulo("whatsapp");
        licenca.setAtivo(true);
        licenca.setValorMensalExtra(new BigDecimal("39.90"));
        licenca.setBloqueadoComercial(true);
        licenca.setMotivoBloqueioComercial("Bloqueio automático por inadimplência de add-ons. Vencimento em 2026-04-01.");

        when(licencaModuloEmpresaRepository.findByEmpresaIdOrderByModuloAsc(4L)).thenReturn(List.of(licenca));

        int liberados = licenciamentoModuloService.liberarBloqueiosAutomaticosPorPagamento(4L);

        assertEquals(1, liberados);
        assertEquals(false, licenca.getBloqueadoComercial());
        assertEquals(null, licenca.getMotivoBloqueioComercial());
        verify(licencaModuloEmpresaRepository).save(licenca);
    }
}
