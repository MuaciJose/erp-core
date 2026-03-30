package com.grandport.erp.modules.usuario.service;

import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Autenticacao Service")
class AutenticacaoServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private AutenticacaoService autenticacaoService;

    @Test
    @DisplayName("Deve carregar usuario pelo username")
    void deveCarregarUsuarioPeloUsername() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");

        when(usuarioRepository.findByUsername("admin")).thenReturn(usuario);

        var resultado = autenticacaoService.loadUserByUsername("admin");

        assertEquals(usuario, resultado);
        verify(usuarioRepository).findByUsername("admin");
    }

    @Test
    @DisplayName("Deve lancar excecao quando repositorio nao encontrar usuario")
    void deveLancarExcecaoQuandoUsuarioNaoForEncontrado() {
        when(usuarioRepository.findByUsername("inexistente")).thenReturn(null);

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> autenticacaoService.loadUserByUsername("inexistente")
        );

        assertEquals("Usuário não encontrado: inexistente", exception.getMessage());
        verify(usuarioRepository).findByUsername("inexistente");
    }
}
