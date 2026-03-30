package com.grandport.erp.modules.usuario.service;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Testes - Token Service")
class TokenServiceTest {

    @Test
    @DisplayName("Deve gerar e validar token com secret configurado")
    void deveGerarEValidarToken() {
        TokenService tokenService = new TokenService();
        ReflectionTestUtils.setField(tokenService, "secret", "secret-de-teste-123456789");
        tokenService.validateConfiguration();

        Usuario usuario = new Usuario();
        usuario.setUsername("admin");

        String token = tokenService.gerarToken(usuario);
        String subject = tokenService.validateToken(token);

        assertNotNull(token);
        assertEquals("admin", subject);
    }

    @Test
    @DisplayName("Deve falhar quando secret nao estiver configurado")
    void deveFalharSemSecret() {
        TokenService tokenService = new TokenService();
        ReflectionTestUtils.setField(tokenService, "secret", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class, tokenService::validateConfiguration);

        assertEquals("JWT secret não configurado. Defina a variável JWT_SECRET ou a propriedade api.security.token.secret.", exception.getMessage());
    }

    @Test
    @DisplayName("Deve retornar vazio para token invalido")
    void deveRetornarVazioParaTokenInvalido() {
        TokenService tokenService = new TokenService();
        ReflectionTestUtils.setField(tokenService, "secret", "secret-de-teste-123456789");
        tokenService.validateConfiguration();

        String subject = tokenService.validateToken("token-invalido");

        assertFalse(subject == null);
        assertEquals("", subject);
    }
}
