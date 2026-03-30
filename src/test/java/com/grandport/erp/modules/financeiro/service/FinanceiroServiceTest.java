package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.repository.ContaBancariaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Financeiro Service")
class FinanceiroServiceTest {

    @Mock
    private ContaBancariaRepository contaBancariaRepository;

    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private FinanceiroService financeiroService;

    private ContaBancaria contaBancaria;

    @BeforeEach
    void setUp() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setEmpresaId(1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );

        contaBancaria = new ContaBancaria();
        contaBancaria.setId(1L);
        contaBancaria.setNome("Banco do Brasil");
        contaBancaria.setTipo("BANCO");
        contaBancaria.setNumeroBanco("001");
        contaBancaria.setAgencia("0001");
        contaBancaria.setNumeroConta("123456");
        contaBancaria.setDigitoConta("7");
        contaBancaria.setSaldoAtual(BigDecimal.ZERO);
        contaBancaria.setEmpresaId(1L);
        contaBancaria.setAtivo(true);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve listar contas bancarias ativas da empresa autenticada")
    void deveListarContasBancarias() {
        when(contaBancariaRepository.findByEmpresaIdAndAtivoTrue(1L)).thenReturn(List.of(contaBancaria));

        var resultado = financeiroService.listarContasBancarias();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Banco do Brasil", resultado.get(0).getNome());
        verify(contaBancariaRepository).findByEmpresaIdAndAtivoTrue(1L);
    }

    @Test
    @DisplayName("Deve criar conta bancaria com empresa do usuario autenticado")
    void deveCriarContaBancaria() {
        when(contaBancariaRepository.save(contaBancaria)).thenReturn(contaBancaria);

        var resultado = financeiroService.criarContaBancaria(contaBancaria);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getEmpresaId());
        verify(contaBancariaRepository).save(contaBancaria);
        verify(auditoriaService).registrar("FINANCEIRO", "CRIACAO_CONTA", "Criou a conta bancária: Banco do Brasil");
    }

    @Test
    @DisplayName("Deve atualizar conta bancaria da empresa autenticada")
    void deveAtualizarContaBancaria() {
        ContaBancaria atualizada = new ContaBancaria();
        atualizada.setNome("Caixa Economica");
        atualizada.setTipo("BANCO");
        atualizada.setNumeroBanco("104");
        atualizada.setAgencia("0002");
        atualizada.setNumeroConta("654321");
        atualizada.setDigitoConta("0");

        when(contaBancariaRepository.findByEmpresaIdAndId(1L, 1L)).thenReturn(Optional.of(contaBancaria));
        when(contaBancariaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = financeiroService.atualizarContaBancaria(1L, atualizada);

        assertNotNull(resultado);
        assertEquals("Caixa Economica", resultado.getNome());
        assertEquals("104", resultado.getNumeroBanco());
        verify(auditoriaService).registrar("FINANCEIRO", "ATUALIZACAO_CONTA", "Atualizou a conta bancária: Caixa Economica");
    }

    @Test
    @DisplayName("Deve marcar conta como inativa no soft delete")
    void deveFazerSoftDeleteDaContaBancaria() {
        when(contaBancariaRepository.findByEmpresaIdAndId(1L, 1L)).thenReturn(Optional.of(contaBancaria));
        when(contaBancariaRepository.save(any(ContaBancaria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        financeiroService.excluirContaBancaria(1L);

        assertFalse(contaBancaria.getAtivo());
        verify(contaBancariaRepository).save(contaBancaria);
    }

    @Test
    @DisplayName("Nao deve excluir conta com saldo diferente de zero")
    void naoDeveExcluirContaComSaldo() {
        contaBancaria.setSaldoAtual(BigDecimal.TEN);
        when(contaBancariaRepository.findByEmpresaIdAndId(1L, 1L)).thenReturn(Optional.of(contaBancaria));

        var exception = assertThrows(RuntimeException.class, () -> financeiroService.excluirContaBancaria(1L));

        assertEquals("Não é permitido excluir conta com saldo. Zere o saldo antes de excluir.", exception.getMessage());
    }
}
