package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.assinatura.service.TenantAccessService;
import com.grandport.erp.modules.usuario.dto.AuthFlowResponseDTO;
import com.grandport.erp.modules.usuario.dto.LoginDTO;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.MfaChallengeService;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import com.grandport.erp.modules.usuario.service.TokenService;
import com.grandport.erp.modules.usuario.service.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Autenticacao Controller")
class AutenticacaoControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private TokenService tokenService;

    @Mock
    private AuditoriaService auditoriaService;

    @Mock
    private com.grandport.erp.config.security.LoginAttemptService loginAttemptService;

    @Mock
    private PasswordPolicyService passwordPolicyService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MfaChallengeService mfaChallengeService;

    @Mock
    private TotpService totpService;

    @Mock
    private SecurityEventService securityEventService;

    @Mock
    private TenantAccessService tenantAccessService;

    @Mock
    private PlanoPermissaoService planoPermissaoService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AutenticacaoController autenticacaoController;

    @Test
    @DisplayName("POST /auth/login deve autenticar e retornar token")
    void deveAutenticarERetornarToken() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("admin");
        usuario.setNomeCompleto("Administrador");
        usuario.setEmpresaId(1L);

        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());

        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(loginAttemptService.isBlocked(any())).thenReturn(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-token");
        when(planoPermissaoService.toDtoFiltrado(usuario)).thenReturn(new UsuarioDTO(usuario));

        var response = autenticacaoController.login(new LoginDTO("admin", "admin123"), request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertInstanceOf(AuthFlowResponseDTO.class, response.getBody());

        AuthFlowResponseDTO body = (AuthFlowResponseDTO) response.getBody();
        assertEquals("jwt-token", body.token());
        assertEquals("Administrador", body.usuario().getNome());
        assertEquals("admin", body.usuario().getEmail());

        verify(loginAttemptService).recordSuccess(eq("ip:127.0.0.1"));
        verify(loginAttemptService).recordSuccess(eq("user:admin"));
        verify(auditoriaService).registrar("SEGURANCA", "LOGIN_SUCESSO", "Login realizado para o usuário: admin");
    }

    @Test
    @DisplayName("POST /auth/login deve retornar challenge MFA com otpauthUri no setup inicial")
    void deveRetornarQrNoSetupInicialDoMfa() {
        Usuario usuario = new Usuario();
        usuario.setId(2L);
        usuario.setEmpresaId(1L);
        usuario.setUsername("gestor");
        usuario.setNomeCompleto("Gestor");
        usuario.setTipoAcesso(TipoAcesso.TENANT_ADMIN);
        usuario.setMfaEnabled(false);
        usuario.setMfaSecret(null);

        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());

        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(loginAttemptService.isBlocked(any())).thenReturn(false);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(planoPermissaoService.toDtoFiltrado(usuario)).thenReturn(new UsuarioDTO(usuario));
        when(totpService.generateSecret()).thenReturn("ABCDEF123456");
        when(mfaChallengeService.createChallenge(usuario, "ABCDEF123456")).thenReturn("challenge-123");
        when(totpService.buildOtpAuthUri("Grandport ERP", "gestor", "ABCDEF123456"))
                .thenReturn("otpauth://totp/Grandport%20ERP:gestor?secret=ABCDEF123456");
        when(totpService.buildQrCodeDataUrl("otpauth://totp/Grandport%20ERP:gestor?secret=ABCDEF123456", 220))
                .thenReturn("data:image/png;base64,abc123");

        var response = autenticacaoController.login(new LoginDTO("gestor", "admin123"), request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(AuthFlowResponseDTO.class, response.getBody());

        AuthFlowResponseDTO body = (AuthFlowResponseDTO) response.getBody();
        assertTrue(body.mfaSetupRequired());
        assertEquals("challenge-123", body.challengeToken());
        assertEquals("ABCDEF123456", body.setupSecret());
        assertEquals("otpauth://totp/Grandport%20ERP:gestor?secret=ABCDEF123456", body.otpauthUri());
        assertEquals("data:image/png;base64,abc123", body.qrCodeDataUrl());
    }
}
