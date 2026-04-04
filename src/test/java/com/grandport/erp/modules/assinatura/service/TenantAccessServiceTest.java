package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Tenant Access Service")
class TenantAccessServiceTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private SecurityEventService securityEventService;

    @Mock
    private PlataformaAvisoOperacionalService plataformaAvisoOperacionalService;

    @InjectMocks
    private TenantAccessService tenantAccessService;

    @Test
    @DisplayName("Deve permitir acesso durante a tolerância mesmo com vencimento passado")
    void devePermitirAcessoDuranteTolerancia() {
        Usuario usuario = new Usuario();
        usuario.setEmpresaId(10L);
        usuario.setTipoAcesso(TipoAcesso.TENANT_ADMIN);
        usuario.setUsername("admin@tenant.com");

        Empresa empresa = new Empresa();
        empresa.setId(10L);
        empresa.setAtivo(true);
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setDataVencimento(LocalDate.now().minusDays(1));
        empresa.setDiasTolerancia(3);

        when(empresaRepository.findById(10L)).thenReturn(Optional.of(empresa));
        when(plataformaAvisoOperacionalService.manutencaoBloqueandoAcesso()).thenReturn(false);

        assertDoesNotThrow(() -> tenantAccessService.validarAcesso(usuario));
    }

    @Test
    @DisplayName("Deve bloquear acesso após tolerância")
    void deveBloquearAcessoAposTolerancia() {
        Usuario usuario = new Usuario();
        usuario.setEmpresaId(10L);
        usuario.setTipoAcesso(TipoAcesso.TENANT_ADMIN);
        usuario.setUsername("admin@tenant.com");

        Empresa empresa = new Empresa();
        empresa.setId(10L);
        empresa.setAtivo(true);
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setDataVencimento(LocalDate.now().minusDays(5));
        empresa.setDiasTolerancia(2);

        when(empresaRepository.findById(10L)).thenReturn(Optional.of(empresa));
        when(plataformaAvisoOperacionalService.manutencaoBloqueandoAcesso()).thenReturn(false);

        assertThrows(TenantAccessBlockedException.class, () -> tenantAccessService.validarAcesso(usuario));
    }
}
