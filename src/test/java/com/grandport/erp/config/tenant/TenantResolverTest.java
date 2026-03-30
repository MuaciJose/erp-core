package com.grandport.erp.config.tenant;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Testes - Tenant Resolver")
class TenantResolverTest {

    private final TenantResolver tenantResolver = new TenantResolver();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve retornar tenant de sistema quando autenticacao for anonima")
    void deveRetornarTenantDeSistemaParaAutenticacaoAnonima() {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken("key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"))
        );

        Long tenantId = tenantResolver.resolveCurrentTenantIdentifier();

        assertEquals(0L, tenantId);
    }

    @Test
    @DisplayName("Deve retornar empresa do usuario autenticado")
    void deveRetornarEmpresaDoUsuarioAutenticado() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setEmpresaId(7L);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );

        Long tenantId = tenantResolver.resolveCurrentTenantIdentifier();

        assertEquals(7L, tenantId);
    }

    @Test
    @DisplayName("Deve falhar quando usuario autenticado nao tiver empresa")
    void deveFalharQuandoUsuarioNaoTiverEmpresa() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> tenantResolver.resolveCurrentTenantIdentifier());

        assertEquals("Usuario autenticado sem empresa configurada.", exception.getMessage());
    }
}
