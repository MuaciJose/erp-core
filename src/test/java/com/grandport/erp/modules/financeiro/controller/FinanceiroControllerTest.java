package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Financeiro Controller")
class FinanceiroControllerTest {

    @Mock
    private FinanceiroService financeiroService;

    @InjectMocks
    private FinanceiroController financeiroController;

    private ContaBancaria contaBancaria;

    @BeforeEach
    void setUp() {
        contaBancaria = new ContaBancaria();
        contaBancaria.setId(1L);
        contaBancaria.setNome("Banco do Brasil");
        contaBancaria.setTipo("BANCO");
        contaBancaria.setNumeroBanco("001");
        contaBancaria.setAgencia("0001");
        contaBancaria.setNumeroConta("123456");
        contaBancaria.setDigitoConta("7");
        contaBancaria.setSaldoAtual(BigDecimal.valueOf(1000.00));
        contaBancaria.setAtivo(true);
    }

    @Test
    @DisplayName("GET /contas-bancarias retorna lista do service")
    void deveListarContasBancarias() {
        when(financeiroService.listarContasBancarias()).thenReturn(List.of(contaBancaria));

        var response = financeiroController.getContasBancarias();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Banco do Brasil", response.getBody().get(0).getNome());
    }

    @Test
    @DisplayName("POST /contas-bancarias retorna conta criada")
    void deveCriarContaBancaria() {
        when(financeiroService.criarContaBancaria(contaBancaria)).thenReturn(contaBancaria);

        var response = financeiroController.criarContaBancaria(contaBancaria);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Banco do Brasil", response.getBody().getNome());
    }

    @Test
    @DisplayName("PUT /contas-bancarias/{id} retorna conta atualizada")
    void deveAtualizarContaBancaria() {
        ContaBancaria atualizada = new ContaBancaria();
        atualizada.setNome("Caixa Economica");

        when(financeiroService.atualizarContaBancaria(1L, atualizada)).thenReturn(atualizada);

        var response = financeiroController.atualizarContaBancaria(1L, atualizada);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Caixa Economica", response.getBody().getNome());
    }

    @Test
    @DisplayName("DELETE /contas-bancarias/{id} delega exclusao e retorna 200")
    void deveExcluirContaBancaria() {
        var response = financeiroController.excluirContaBancaria(1L);

        verify(financeiroService).excluirContaBancaria(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
    }
}
