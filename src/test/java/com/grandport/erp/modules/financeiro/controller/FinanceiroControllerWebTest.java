package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Web - Financeiro Controller")
class FinanceiroControllerWebTest {

    @Mock
    private FinanceiroService financeiroService;

    @InjectMocks
    private FinanceiroController financeiroController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(financeiroController).build();
    }

    @Test
    @DisplayName("GET /api/financeiro/contas-bancarias deve responder lista em JSON")
    void deveListarContasBancariasEmJson() throws Exception {
        ContaBancaria conta = new ContaBancaria();
        conta.setId(1L);
        conta.setNome("Banco do Brasil");
        conta.setTipo("BANCO");
        conta.setNumeroBanco("001");
        conta.setAgencia("0001");
        conta.setNumeroConta("123456");
        conta.setDigitoConta("7");
        conta.setSaldoAtual(BigDecimal.valueOf(1500.75));
        conta.setAtivo(true);

        when(financeiroService.listarContasBancarias()).thenReturn(List.of(conta));

        mockMvc.perform(get("/api/financeiro/contas-bancarias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].nome").value("Banco do Brasil"))
                .andExpect(jsonPath("$[0].tipo").value("BANCO"))
                .andExpect(jsonPath("$[0].saldoAtual").value(1500.75))
                .andExpect(jsonPath("$[0].ativo").value(true));
    }

    @Test
    @DisplayName("POST /api/financeiro/contas-bancarias deve responder conta criada em JSON")
    void deveCriarContaBancariaEmJson() throws Exception {
        ContaBancaria conta = new ContaBancaria();
        conta.setId(2L);
        conta.setNome("Caixa");
        conta.setTipo("BANCO");
        conta.setNumeroBanco("104");
        conta.setAgencia("1234");
        conta.setNumeroConta("987654");
        conta.setDigitoConta("0");
        conta.setSaldoAtual(BigDecimal.ZERO);
        conta.setAtivo(true);

        when(financeiroService.criarContaBancaria(org.mockito.ArgumentMatchers.any(ContaBancaria.class))).thenReturn(conta);

        mockMvc.perform(post("/api/financeiro/contas-bancarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conta)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.nome").value("Caixa"))
                .andExpect(jsonPath("$.numeroBanco").value("104"))
                .andExpect(jsonPath("$.ativo").value(true));
    }
}
