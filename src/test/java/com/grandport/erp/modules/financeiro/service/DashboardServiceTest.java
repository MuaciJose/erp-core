package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.vendas.repository.RevisaoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Dashboard Service")
class DashboardServiceTest {

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private ContaReceberRepository contaReceberRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private RevisaoRepository revisaoRepository;

    @Mock
    private ConfiguracaoRepository configuracaoRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setEmpresaId(99L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );

        ConfiguracaoSistema configuracao = new ConfiguracaoSistema();
        configuracao.setEmpresaId(99L);
        configuracao.setMetaFaturamentoPeriodo(new BigDecimal("15000.00"));
        configuracao.setMetaPedidosPeriodo(12);
        when(configuracaoRepository.findFirstByEmpresaIdOrderByIdDesc(99L)).thenReturn(Optional.of(configuracao));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve gerar resumo do dashboard com isolamento por empresa")
    void deveGerarResumoComIsolamentoPorEmpresa() {
        when(vendaRepository.sumTotalVendasPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(new BigDecimal("12500.00")))
                .thenReturn(Optional.of(new BigDecimal("10000.00")));
        when(vendaRepository.sumTotalDescontosPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(new BigDecimal("500.00")));
        when(vendaRepository.sumCmvPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(new BigDecimal("4200.00")));
        when(contaReceberRepository.sumContasAtrasadas(99L))
                .thenReturn(Optional.of(new BigDecimal("750.00")));
        when(vendaRepository.countVendasByDataEmpresa(any(), any(), eq(99L))).thenReturn(8L).thenReturn(6L);
        when(produtoRepository.countProdutosBaixoEstoqueByEmpresa(99L)).thenReturn(3L);
        when(revisaoRepository.countRevisoesAtrasadasByEmpresa(99L)).thenReturn(2L);
        when(revisaoRepository.countRevisoesParaHojeByEmpresa(99L)).thenReturn(4L);
        when(vendaRepository.findTop5ProdutosMaisVendidosMesEmpresa(any(), any(), eq(99L)))
                .thenReturn(List.of(new DashboardResumoDTO.TopProdutoDTO("Filtro de Oleo", 10L, new BigDecimal("900.00"))));
        when(vendaRepository.findCategoriasMaisVendidasPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(List.of(new DashboardResumoDTO.CategoriaVendaDTO("Filtros", 10)));

        DashboardResumoDTO resumo = dashboardService.getResumoDashboard("MONTH");

        assertNotNull(resumo);
        assertEquals(new BigDecimal("12500.00"), resumo.getFaturamentoMes());
        assertEquals(new BigDecimal("10000.00"), resumo.getFaturamentoPeriodoAnterior());
        assertEquals(new BigDecimal("15000.00"), resumo.getMetaFaturamentoPeriodo());
        assertEquals(new BigDecimal("500.00"), resumo.getDescontosPeriodo());
        assertEquals(new BigDecimal("4200.00"), resumo.getCmvPeriodo());
        assertEquals(new BigDecimal("12000.00"), resumo.getReceitaLiquidaPeriodo());
        assertEquals(new BigDecimal("7800.00"), resumo.getLucroBrutoPeriodo());
        assertEquals(new BigDecimal("65.0000"), resumo.getMargemBrutaPeriodo());
        assertEquals(new BigDecimal("750.00"), resumo.getReceberAtrasado());
        assertEquals(8L, resumo.getVendasHoje());
        assertEquals(6L, resumo.getVendasPeriodoAnterior());
        assertEquals(12L, resumo.getMetaPedidosPeriodo());
        assertEquals(3L, resumo.getProdutosBaixoEstoque());
        assertEquals(2L, resumo.getCrmAtrasados());
        assertEquals(4L, resumo.getCrmHoje());
        assertEquals(1, resumo.getTopProdutos().size());
        assertEquals("Filtro de Oleo", resumo.getTopProdutos().get(0).getNome());
        assertEquals(1, resumo.getVendasPorCategoria().size());
        assertEquals("Filtros", resumo.getVendasPorCategoria().get(0).getName());

        verify(contaReceberRepository).sumContasAtrasadas(99L);
        verify(produtoRepository).countProdutosBaixoEstoqueByEmpresa(99L);
        verify(revisaoRepository).countRevisoesAtrasadasByEmpresa(99L);
        verify(revisaoRepository).countRevisoesParaHojeByEmpresa(99L);
        verify(vendaRepository).findTop5ProdutosMaisVendidosMesEmpresa(any(), any(), eq(99L));
        verify(vendaRepository).findCategoriasMaisVendidasPeriodoEmpresa(any(), any(), eq(99L));
    }

    @Test
    @DisplayName("Deve respeitar periodo de 7 dias ao consultar vendas")
    void deveRespeitarPeriodoDeSeteDias() {
        mockResumoVazio();

        dashboardService.getResumoDashboard("7D");

        ArgumentCaptor<LocalDateTime> inicioCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> fimCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(vendaRepository).findTop5ProdutosMaisVendidosMesEmpresa(inicioCaptor.capture(), fimCaptor.capture(), eq(99L));

        LocalDate inicioEsperado = LocalDate.now().minusDays(6);
        assertEquals(inicioEsperado, inicioCaptor.getValue().toLocalDate());
        assertEquals(LocalDate.now(), fimCaptor.getValue().toLocalDate());
    }

    @Test
    @DisplayName("Deve respeitar periodo de hoje ao consultar vendas")
    void deveRespeitarPeriodoDeHoje() {
        mockResumoVazio();

        dashboardService.getResumoDashboard("TODAY");

        ArgumentCaptor<LocalDateTime> inicioCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> fimCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(vendaRepository).findTop5ProdutosMaisVendidosMesEmpresa(inicioCaptor.capture(), fimCaptor.capture(), eq(99L));

        assertEquals(LocalDate.now(), inicioCaptor.getValue().toLocalDate());
        assertEquals(0, inicioCaptor.getValue().toLocalTime().getHour());
        assertEquals(LocalDate.now(), fimCaptor.getValue().toLocalDate());
    }

    @Test
    @DisplayName("Deve respeitar periodo de 30 dias ao consultar vendas")
    void deveRespeitarPeriodoDeTrintaDias() {
        mockResumoVazio();

        dashboardService.getResumoDashboard("30D");

        ArgumentCaptor<LocalDateTime> inicioCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> fimCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(vendaRepository).findTop5ProdutosMaisVendidosMesEmpresa(inicioCaptor.capture(), fimCaptor.capture(), eq(99L));

        LocalDate inicioEsperado = LocalDate.now().minusDays(29);
        assertEquals(inicioEsperado, inicioCaptor.getValue().toLocalDate());
        assertEquals(LocalDate.now(), fimCaptor.getValue().toLocalDate());
    }

    @Test
    @DisplayName("Deve usar mes atual quando periodo for invalido")
    void deveUsarMesAtualQuandoPeriodoForInvalido() {
        mockResumoVazio();

        dashboardService.getResumoDashboard("INVALIDO");

        ArgumentCaptor<LocalDateTime> inicioCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> fimCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(vendaRepository).findTop5ProdutosMaisVendidosMesEmpresa(inicioCaptor.capture(), fimCaptor.capture(), eq(99L));

        assertEquals(LocalDate.now().withDayOfMonth(1), inicioCaptor.getValue().toLocalDate());
        assertEquals(LocalDate.now(), fimCaptor.getValue().toLocalDate());
    }

    private void mockResumoVazio() {
        clearInvocations(vendaRepository, contaReceberRepository, produtoRepository, revisaoRepository);
        when(vendaRepository.sumTotalVendasPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(BigDecimal.ZERO))
                .thenReturn(Optional.of(BigDecimal.ZERO));
        when(vendaRepository.sumTotalDescontosPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(BigDecimal.ZERO));
        when(vendaRepository.sumCmvPeriodoEmpresa(any(), any(), eq(99L)))
                .thenReturn(Optional.of(BigDecimal.ZERO));
        when(contaReceberRepository.sumContasAtrasadas(99L))
                .thenReturn(Optional.of(BigDecimal.ZERO));
        when(vendaRepository.countVendasByDataEmpresa(any(), any(), eq(99L))).thenReturn(0L).thenReturn(0L);
        when(produtoRepository.countProdutosBaixoEstoqueByEmpresa(99L)).thenReturn(0L);
        when(revisaoRepository.countRevisoesAtrasadasByEmpresa(99L)).thenReturn(0L);
        when(revisaoRepository.countRevisoesParaHojeByEmpresa(99L)).thenReturn(0L);
        when(vendaRepository.findTop5ProdutosMaisVendidosMesEmpresa(any(), any(), eq(99L))).thenReturn(List.of());
        when(vendaRepository.findCategoriasMaisVendidasPeriodoEmpresa(any(), any(), eq(99L))).thenReturn(List.of());
    }
}
