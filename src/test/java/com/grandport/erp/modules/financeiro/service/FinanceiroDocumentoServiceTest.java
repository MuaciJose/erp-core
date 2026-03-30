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
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Financeiro Documento Service")
class FinanceiroDocumentoServiceTest {

    @Mock
    private ConfiguracaoAtualService configuracaoAtualService;

    @Mock
    private EmpresaContextService empresaContextService;

    @Mock
    private ContaPagarRepository contaPagarRepository;

    @Mock
    private ContaReceberRepository contaReceberRepository;

    @Mock
    private ParceiroRepository parceiroRepository;

    @Mock
    private PdfService pdfService;

    @InjectMocks
    private FinanceiroDocumentoService financeiroDocumentoService;

    private ConfiguracaoSistema configuracaoSistema;

    @BeforeEach
    void setUp() {
        configuracaoSistema = new ConfiguracaoSistema();
        configuracaoSistema.setNomeFantasia("Empresa Teste");
        when(empresaContextService.getRequiredEmpresaId()).thenReturn(10L);
        when(configuracaoAtualService.obterAtual()).thenReturn(configuracaoSistema);
    }

    @Test
    @DisplayName("Deve gerar recibo de pagamento com conta da empresa autenticada")
    void deveGerarReciboPagamentoDaEmpresaAutenticada() {
        ContaPagar conta = new ContaPagar();
        conta.setId(1L);
        conta.setDescricao("Conta de energia");
        conta.setValorOriginal(new BigDecimal("123.45"));
        Parceiro parceiro = new Parceiro();
        parceiro.setNome("Fornecedor XPTO");
        conta.setParceiro(parceiro);

        when(contaPagarRepository.findByEmpresaIdAndId(10L, 1L)).thenReturn(Optional.of(conta));
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("recibo-pagar".getBytes());

        byte[] resultado = financeiroDocumentoService.gerarReciboPagamento(1L);

        assertArrayEquals("recibo-pagar".getBytes(), resultado);
        verify(contaPagarRepository).findByEmpresaIdAndId(10L, 1L);

        ArgumentCaptor<Map<String, Object>> variaveisCaptor = ArgumentCaptor.forClass(Map.class);
        verify(pdfService).gerarPdfDeStringHtml(anyString(), variaveisCaptor.capture());
        Map<String, Object> variaveis = variaveisCaptor.getValue();
        assertEquals("Fornecedor XPTO", variaveis.get("fornecedorNome"));
        assertEquals(123.45, (double) variaveis.get("valorConta"));
    }

    @Test
    @DisplayName("Deve gerar extrato de cliente filtrando periodo e somando totais")
    void deveGerarExtratoClienteComFiltroETotais() {
        Parceiro parceiro = new Parceiro();
        parceiro.setId(2L);
        parceiro.setNome("Cliente Premium");

        ContaReceber recebida = new ContaReceber();
        recebida.setId(11L);
        recebida.setDescricao("Parcela 1");
        recebida.setDataVencimento(LocalDateTime.of(2026, 3, 10, 0, 0));
        recebida.setDataPagamento(LocalDateTime.of(2026, 3, 11, 0, 0));
        recebida.setStatus(StatusFinanceiro.PAGO);
        recebida.setValorOriginal(new BigDecimal("50.00"));

        ContaReceber pendente = new ContaReceber();
        pendente.setId(12L);
        pendente.setDescricao("Parcela 2");
        pendente.setDataVencimento(LocalDateTime.of(2026, 3, 20, 0, 0));
        pendente.setStatus(StatusFinanceiro.PENDENTE);
        pendente.setValorOriginal(new BigDecimal("80.00"));

        ContaReceber foraDoPeriodo = new ContaReceber();
        foraDoPeriodo.setId(13L);
        foraDoPeriodo.setDescricao("Parcela fora");
        foraDoPeriodo.setDataVencimento(LocalDateTime.of(2026, 4, 5, 0, 0));
        foraDoPeriodo.setStatus(StatusFinanceiro.PENDENTE);
        foraDoPeriodo.setValorOriginal(new BigDecimal("999.00"));

        when(parceiroRepository.findByEmpresaIdAndId(10L, 2L)).thenReturn(Optional.of(parceiro));
        when(contaReceberRepository.findByEmpresaIdAndParceiroIdOrderByDataVencimentoAsc(10L, 2L))
                .thenReturn(List.of(recebida, pendente, foraDoPeriodo));
        when(pdfService.gerarPdfDeStringHtml(anyString(), anyMap())).thenReturn("extrato-cliente".getBytes());

        byte[] resultado = financeiroDocumentoService.gerarExtratoCliente(2L, "2026-03-01", "2026-03-31");

        assertArrayEquals("extrato-cliente".getBytes(), resultado);
        verify(parceiroRepository).findByEmpresaIdAndId(10L, 2L);
        verify(contaReceberRepository).findByEmpresaIdAndParceiroIdOrderByDataVencimentoAsc(10L, 2L);

        ArgumentCaptor<Map<String, Object>> variaveisCaptor = ArgumentCaptor.forClass(Map.class);
        verify(pdfService).gerarPdfDeStringHtml(anyString(), variaveisCaptor.capture());
        Map<String, Object> variaveis = variaveisCaptor.getValue();

        assertEquals(parceiro, variaveis.get("parceiro"));
        assertEquals(80.0, (double) variaveis.get("totalPendente"));
        assertEquals(50.0, (double) variaveis.get("totalRecebido"));
        assertEquals(130.0, (double) variaveis.get("totalGeral"));
        assertEquals(2, ((List<?>) variaveis.get("contas")).size());
    }
}
