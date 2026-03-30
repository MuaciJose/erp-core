package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.pdf.service.PdfService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Financeiro Relatorio Service")
class FinanceiroRelatorioServiceTest {

    @Mock
    private ContaPagarRepository contaPagarRepository;

    @Mock
    private ContaReceberRepository contaReceberRepository;

    @Mock
    private ConfiguracaoAtualService configuracaoAtualService;

    @Mock
    private EmpresaContextService empresaContextService;

    @Mock
    private PdfService pdfService;

    @InjectMocks
    private FinanceiroRelatorioService financeiroRelatorioService;

    private ConfiguracaoSistema configuracaoSistema;

    @BeforeEach
    void setUp() {
        configuracaoSistema = new ConfiguracaoSistema();
        configuracaoSistema.setNomeFantasia("Empresa Teste");
        when(empresaContextService.getRequiredEmpresaId()).thenReturn(10L);
        when(configuracaoAtualService.obterAtual()).thenReturn(configuracaoSistema);
    }

    @Test
    @DisplayName("Deve gerar relatorio de contas a pagar filtrando por empresa e status")
    void deveGerarRelatorioPagarFiltrandoPorEmpresaEStatus() {
        ContaPagar pendente = criarContaPagar(1L, "Fornecedor A", "Servico A",
                LocalDateTime.of(2026, 3, 10, 0, 0), null, StatusFinanceiro.PENDENTE, "100.00");
        ContaPagar paga = criarContaPagar(2L, "Fornecedor B", "Servico B",
                LocalDateTime.of(2026, 3, 11, 0, 0), LocalDateTime.of(2026, 3, 12, 0, 0), StatusFinanceiro.PAGO, "50.00");

        when(contaPagarRepository.findByEmpresaIdOrderByDataVencimentoAsc(10L)).thenReturn(List.of(pendente, paga));
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("pdf-pagar".getBytes());

        byte[] resultado = financeiroRelatorioService.gerarPdfRelatorioPagar("", "2026-03-01", "2026-03-31", "PENDENTES", "VENCIMENTO");

        assertArrayEquals("pdf-pagar".getBytes(), resultado);
        verify(contaPagarRepository).findByEmpresaIdOrderByDataVencimentoAsc(10L);

        ArgumentCaptor<Map<String, Object>> variaveisCaptor = ArgumentCaptor.forClass(Map.class);
        verify(pdfService).gerarPdfDeStringHtml(anyString(), variaveisCaptor.capture());

        Map<String, Object> variaveis = variaveisCaptor.getValue();
        assertEquals("Relatorio de Contas a Pagar (Pendentes)", variaveis.get("tituloRelatorio"));
        assertEquals(100.0, (double) variaveis.get("totalGeral"));
        assertEquals(configuracaoSistema, variaveis.get("empresa"));

        List<?> contas = (List<?>) variaveis.get("contas");
        assertEquals(1, contas.size());
        Map<?, ?> conta = (Map<?, ?>) contas.get(0);
        assertEquals("Fornecedor A", conta.get("fornecedorNome"));
        assertEquals("PENDENTE", conta.get("status"));
    }

    @Test
    @DisplayName("Deve gerar relatorio de contas a receber usando data de pagamento")
    void deveGerarRelatorioReceberUsandoDataPagamento() {
        ContaReceber recebida = criarContaReceber(3L, "Cliente A", "Venda A",
                LocalDateTime.of(2026, 3, 1, 0, 0), LocalDateTime.of(2026, 3, 15, 0, 0), StatusFinanceiro.PAGO, "75.50");
        ContaReceber pendente = criarContaReceber(4L, "Cliente B", "Venda B",
                LocalDateTime.of(2026, 3, 20, 0, 0), null, StatusFinanceiro.PENDENTE, "90.00");

        when(contaReceberRepository.findByEmpresaIdOrderByDataVencimentoAsc(10L)).thenReturn(List.of(recebida, pendente));
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("pdf-receber".getBytes());

        byte[] resultado = financeiroRelatorioService.gerarPdfRelatorioReceber("", "2026-03-10", "2026-03-20", "PAGAS", "PAGAMENTO");

        assertArrayEquals("pdf-receber".getBytes(), resultado);
        verify(contaReceberRepository).findByEmpresaIdOrderByDataVencimentoAsc(10L);

        ArgumentCaptor<Map<String, Object>> variaveisCaptor = ArgumentCaptor.forClass(Map.class);
        verify(pdfService).gerarPdfDeStringHtml(anyString(), variaveisCaptor.capture());

        Map<String, Object> variaveis = variaveisCaptor.getValue();
        assertEquals("Relatorio de Contas Recebidas", variaveis.get("tituloRelatorio"));
        assertEquals(75.5, (double) variaveis.get("totalGeral"));

        List<?> contas = (List<?>) variaveis.get("contas");
        assertEquals(1, contas.size());
        Map<?, ?> conta = (Map<?, ?>) contas.get(0);
        assertEquals("Cliente A", conta.get("fornecedorNome"));
        assertEquals("RECEBIDO", conta.get("status"));
        assertNotNull(conta.get("dataVencimento"));
    }

    private ContaPagar criarContaPagar(Long id, String parceiroNome, String descricao, LocalDateTime vencimento,
                                       LocalDateTime pagamento, StatusFinanceiro status, String valor) {
        ContaPagar conta = new ContaPagar();
        conta.setId(id);
        conta.setDescricao(descricao);
        conta.setDataVencimento(vencimento);
        conta.setDataPagamento(pagamento);
        conta.setStatus(status);
        conta.setValorOriginal(new BigDecimal(valor));
        Parceiro parceiro = new Parceiro();
        parceiro.setNome(parceiroNome);
        conta.setParceiro(parceiro);
        return conta;
    }

    private ContaReceber criarContaReceber(Long id, String parceiroNome, String descricao, LocalDateTime vencimento,
                                           LocalDateTime pagamento, StatusFinanceiro status, String valor) {
        ContaReceber conta = new ContaReceber();
        conta.setId(id);
        conta.setDescricao(descricao);
        conta.setDataVencimento(vencimento);
        conta.setDataPagamento(pagamento);
        conta.setStatus(status);
        conta.setValorOriginal(new BigDecimal(valor));
        Parceiro parceiro = new Parceiro();
        parceiro.setNome(parceiroNome);
        conta.setParceiro(parceiro);
        return conta;
    }
}
