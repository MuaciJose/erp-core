package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.dto.DreDTO;
import com.grandport.erp.modules.financeiro.service.FinanceiroDocumentoService;
import com.grandport.erp.modules.financeiro.service.FinanceiroRelatorioService;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
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
import java.time.YearMonth;
import java.util.Map;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Web - Financeiro Controller")
class FinanceiroControllerWebTest {

    @Mock
    private FinanceiroService financeiroService;
    @Mock
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;
    @Mock
    private com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService configuracaoAtualService;
    @Mock
    private com.grandport.erp.modules.financeiro.repository.ContaReceberRepository contaReceberRepository;
    @Mock
    private com.grandport.erp.modules.financeiro.repository.ContaPagarRepository contaPagarRepository;
    @Mock
    private com.grandport.erp.modules.vendas.service.WhatsAppService whatsappService;
    @Mock
    private FinanceiroRelatorioService financeiroRelatorioService;
    @Mock
    private FinanceiroDocumentoService financeiroDocumentoService;

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

    @Test
    @DisplayName("GET /api/financeiro/contas-a-receber/{id}/recibo-pdf deve retornar PDF")
    void deveRetornarReciboRecebimentoPdf() throws Exception {
        when(financeiroDocumentoService.gerarReciboRecebimento(8L)).thenReturn("pdf-recibo".getBytes());

        mockMvc.perform(get("/api/financeiro/contas-a-receber/8/recibo-pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Recibo_Recebimento_8.pdf"))
                .andExpect(content().bytes("pdf-recibo".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/contas-a-receber/relatorio-pdf deve retornar PDF")
    void deveRetornarRelatorioReceberPdf() throws Exception {
        when(financeiroRelatorioService.gerarPdfRelatorioReceber("", "", "", "TODAS", "VENCIMENTO"))
                .thenReturn("pdf-relatorio".getBytes());

        mockMvc.perform(get("/api/financeiro/contas-a-receber/relatorio-pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Relatorio_Contas_Receber.pdf"))
                .andExpect(content().bytes("pdf-relatorio".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/extrato-cliente/{id}/pdf deve retornar PDF")
    void deveRetornarExtratoClientePdf() throws Exception {
        when(financeiroDocumentoService.gerarExtratoCliente(5L, "", "")).thenReturn("pdf-extrato".getBytes());

        mockMvc.perform(get("/api/financeiro/extrato-cliente/5/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Extrato_Cliente_5.pdf"))
                .andExpect(content().bytes("pdf-extrato".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/contas-a-pagar/{id}/recibo-pdf deve retornar PDF")
    void deveRetornarReciboPagamentoPdf() throws Exception {
        when(financeiroDocumentoService.gerarReciboPagamento(6L)).thenReturn("pdf-pagamento".getBytes());

        mockMvc.perform(get("/api/financeiro/contas-a-pagar/6/recibo-pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Recibo_6.pdf"))
                .andExpect(content().bytes("pdf-pagamento".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/contas-a-pagar/relatorio-pdf deve retornar PDF")
    void deveRetornarRelatorioPagarPdf() throws Exception {
        when(financeiroRelatorioService.gerarPdfRelatorioPagar("", "", "", "TODAS", "VENCIMENTO"))
                .thenReturn("pdf-pagar".getBytes());

        mockMvc.perform(get("/api/financeiro/contas-a-pagar/relatorio-pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Relatorio_Contas_Pagar.pdf"))
                .andExpect(content().bytes("pdf-pagar".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/extrato-fornecedor/{id}/pdf deve retornar PDF")
    void deveRetornarExtratoFornecedorPdf() throws Exception {
        when(financeiroDocumentoService.gerarExtratoFornecedor(9L, "", "")).thenReturn("pdf-extrato-fornecedor".getBytes());

        mockMvc.perform(get("/api/financeiro/extrato-fornecedor/9/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=Extrato_Fornecedor_9.pdf"))
                .andExpect(content().bytes("pdf-extrato-fornecedor".getBytes()));
    }

    @Test
    @DisplayName("GET /api/financeiro/dre/pdf deve retornar PDF")
    void deveRetornarDrePdf() throws Exception {
        DreDTO dre = new DreDTO();
        dre.setReceitaBruta(BigDecimal.valueOf(10000));
        dre.setDevolucoesDescontos(BigDecimal.valueOf(500));
        dre.setCmv(BigDecimal.valueOf(3000));
        dre.setDespesasOperacionais(Map.of("administrativas", BigDecimal.valueOf(1200)));

        ConfiguracaoSistema config = new ConfiguracaoSistema();
        config.setNomeFantasia("GrandPort");
        config.setLayoutHtmlDre("<html><body>DRE</body></html>");

        when(financeiroService.calcularDre(YearMonth.of(2026, 3))).thenReturn(dre);
        when(configuracaoAtualService.obterAtual()).thenReturn(config);
        when(pdfService.gerarPdfDeStringHtml(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyMap()))
                .thenReturn("pdf-dre".getBytes());

        mockMvc.perform(get("/api/financeiro/dre/pdf").param("mesAno", "2026-03"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "inline; filename=DRE-2026-03.pdf"))
                .andExpect(content().bytes("pdf-dre".getBytes()));
    }
}
