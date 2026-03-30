package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.usuario.dto.LoginDTO;
import com.grandport.erp.modules.usuario.dto.LoginResponseDTO;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.service.TokenService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
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

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-token");

        var response = autenticacaoController.login(new LoginDTO("admin", "admin123"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertInstanceOf(LoginResponseDTO.class, response.getBody());

        LoginResponseDTO body = (LoginResponseDTO) response.getBody();
        assertEquals("jwt-token", body.token());
        assertEquals("Administrador", body.usuario().getNome());
        assertEquals("admin", body.usuario().getEmail());

        verify(auditoriaService).registrar("SISTEMA", "LOGIN", "Usuário realizou login no sistema.");
    }
}
