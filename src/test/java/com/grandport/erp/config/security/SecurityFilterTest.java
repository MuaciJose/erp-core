package com.grandport.erp.config.security;

import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.assinatura.service.TenantAccessService;
import com.grandport.erp.modules.usuario.service.TokenService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static java.util.List.of;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Security Filter")
class SecurityFilterTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private AuthCookieService authCookieService;

    @Mock
    private RedisAvailabilityService redisAvailabilityService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private TenantAccessService tenantAccessService;

    @Mock
    private PlanoPermissaoService planoPermissaoService;

    @InjectMocks
    private SecurityFilter securityFilter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve autenticar usuario quando bearer token for valido")
    void deveAutenticarUsuarioQuandoTokenForValido() throws ServletException, IOException {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setEmpresaId(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-valido");

        when(tokenService.validateToken("token-valido")).thenReturn("admin");
        when(usuarioRepository.findByUsername("admin")).thenReturn(usuario);
        when(planoPermissaoService.getAuthorities(usuario)).thenReturn(of());
        doNothing().when(tenantAccessService).validarAcesso(usuario);

        securityFilter.doFilterInternal(request, new MockHttpServletResponse(), new MockFilterChain());

        assertEquals(usuario, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        verify(usuarioRepository).findByUsername("admin");
    }

    @Test
    @DisplayName("Nao deve autenticar quando token for invalido")
    void naoDeveAutenticarQuandoTokenForInvalido() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-invalido");

        when(tokenService.validateToken("token-invalido")).thenReturn("");

        securityFilter.doFilterInternal(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(usuarioRepository, never()).findByUsername(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("Nao deve consultar usuario quando cabecalho Authorization nao existir")
    void naoDeveConsultarUsuarioSemCabecalhoAuthorization() throws ServletException, IOException {
        when(authCookieService.resolveToken(org.mockito.ArgumentMatchers.any())).thenReturn(null);
        securityFilter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(usuarioRepository, never()).findByUsername(org.mockito.ArgumentMatchers.anyString());
    }
}
