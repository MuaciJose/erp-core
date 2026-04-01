package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.assinatura.service.TenantAccessService;
import com.grandport.erp.config.security.AuthCookieService;
import com.grandport.erp.config.security.RedisAvailabilityService;
import com.grandport.erp.config.security.LoginAttemptService;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.MfaChallengeService;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import com.grandport.erp.modules.usuario.service.TokenService;
import com.grandport.erp.modules.usuario.service.TotpService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Web - Autenticacao Controller")
class AutenticacaoControllerWebTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AuthCookieService authCookieService;

    @Mock
    private RedisAvailabilityService redisAvailabilityService;

    @Mock
    private TokenService tokenService;

    @Mock
    private AuditoriaService auditoriaService;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private PasswordPolicyService passwordPolicyService;

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

    @InjectMocks
    private AutenticacaoController autenticacaoController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(autenticacaoController).build();
    }

    @Test
    @DisplayName("POST /auth/login deve responder JSON com token e usuario")
    void deveResponderJsonDeLogin() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmpresaId(1L);
        usuario.setUsername("admin");
        usuario.setNomeCompleto("Administrador");
        usuario.setPermissoes(List.of("ADMIN"));

        var authentication = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-token-web");
        when(loginAttemptService.isBlocked(any())).thenReturn(false);
        when(planoPermissaoService.toDtoFiltrado(usuario)).thenReturn(new UsuarioDTO(usuario));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", "admin", "senha", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-web"))
                .andExpect(jsonPath("$.usuario.id").value(1))
                .andExpect(jsonPath("$.usuario.nome").value("Administrador"))
                .andExpect(jsonPath("$.usuario.email").value("admin"))
                .andExpect(jsonPath("$.usuario.ativo").value(true))
                .andExpect(jsonPath("$.usuario.permissoes[0]").value("ADMIN"));
    }
}
