package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.dto.InsightDTO;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.repository.RevisaoRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    @Autowired private VendaRepository vendaRepository;
    @Autowired private ContaReceberRepository contaReceberRepository;
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private RevisaoRepository revisaoRepository;
    @Autowired private ConfiguracaoRepository configuracaoRepository;

    // =========================================================================
    // 🛡️ MTODO TTICO PARA PEGAR O ID DA EMPRESA
    // =========================================================================
    private Long getEmpresaId() {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return usuarioLogado.getEmpresaId();
    }

    public DashboardResumoDTO getResumoDashboard() {
        return getResumoDashboard("MONTH");
    }

    public DashboardResumoDTO getResumoDashboard(String periodo) {
        DashboardResumoDTO resumo = new DashboardResumoDTO();
        Long empresaId = getEmpresaId(); // 🚀 Pegamos a empresa logada!
        PeriodoDashboard periodoDashboard = resolverPeriodo(periodo);
        LocalDateTime inicioPeriodoAnterior = periodoDashboard.inicio().minus(periodoDashboard.duracao());
        LocalDateTime fimPeriodoAnterior = periodoDashboard.inicio().minusNanos(1);
        configuracaoRepository.findFirstByEmpresaIdOrderByIdDesc(empresaId).ifPresent(config -> {
            resumo.setMetaFaturamentoPeriodo(config.getMetaFaturamentoPeriodo());
            resumo.setMetaPedidosPeriodo(config.getMetaPedidosPeriodo() == null ? 0L : config.getMetaPedidosPeriodo().longValue());
        });

        LocalDateTime inicioMes = periodoDashboard.inicio();
        LocalDateTime fimMes = periodoDashboard.fim();

        // KPIs Financeiros com tratamento de nulo
        // (Nota: assumindo que a sua VendaRepository tambm no tem blindagem ainda, vamos focar no erro atual)
        resumo.setFaturamentoMes(vendaRepository.sumTotalVendasPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));
        resumo.setFaturamentoPeriodoAnterior(
                vendaRepository.sumTotalVendasPeriodoEmpresa(inicioPeriodoAnterior, fimPeriodoAnterior, empresaId).orElse(BigDecimal.ZERO)
        );
        resumo.setDescontosPeriodo(vendaRepository.sumTotalDescontosPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));
        resumo.setCmvPeriodo(vendaRepository.sumCmvPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));
        resumo.setReceitaLiquidaPeriodo(resumo.getFaturamentoMes().subtract(resumo.getDescontosPeriodo()));
        resumo.setLucroBrutoPeriodo(resumo.getReceitaLiquidaPeriodo().subtract(resumo.getCmvPeriodo()));
        resumo.setMargemBrutaPeriodo(
                resumo.getReceitaLiquidaPeriodo().compareTo(BigDecimal.ZERO) > 0
                        ? resumo.getLucroBrutoPeriodo()
                            .divide(resumo.getReceitaLiquidaPeriodo(), 4, java.math.RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"))
                        : BigDecimal.ZERO
        );

        // 🚀 O CONSERTO DO ERRO DE COMPILAO AQUI!
        resumo.setReceberAtrasado(contaReceberRepository.sumContasAtrasadas(empresaId).orElse(BigDecimal.ZERO));

        Long vendasHoje = vendaRepository.countVendasByDataEmpresa(
                LocalDate.now().atStartOfDay(),
                LocalDate.now().atTime(LocalTime.MAX),
                empresaId
        );
        resumo.setVendasHoje(vendasHoje != null ? vendasHoje : 0L);
        Long vendasPeriodoAnterior = vendaRepository.countVendasByDataEmpresa(inicioPeriodoAnterior, fimPeriodoAnterior, empresaId);
        resumo.setVendasPeriodoAnterior(vendasPeriodoAnterior != null ? vendasPeriodoAnterior : 0L);

        // KPIs de Estoque
        Long baixoEstoque = produtoRepository.countProdutosBaixoEstoqueByEmpresa(empresaId);
        resumo.setProdutosBaixoEstoque(baixoEstoque != null ? baixoEstoque : 0L);

        // =========================================================================
        // KPIs DO CRM (Ps-Venda)
        // =========================================================================
        try {
            Long crmAtrasados = revisaoRepository.countRevisoesAtrasadasByEmpresa(empresaId);
            resumo.setCrmAtrasados(crmAtrasados != null ? crmAtrasados : 0L);

            Long crmHoje = revisaoRepository.countRevisoesParaHojeByEmpresa(empresaId);
            resumo.setCrmHoje(crmHoje != null ? crmHoje : 0L);

            // Adiciona um Alerta se tiver reviso atrasada!
            if (crmAtrasados != null && crmAtrasados > 0) {
                if (resumo.getAlertas() == null) resumo.setAlertas(new ArrayList<>());
                resumo.getAlertas().add(new DashboardResumoDTO.AlertaDTO("CRM / PS-VENDA", "Voc tem " + crmAtrasados + " clientes aguardando contato de reviso. No perca vendas!"));
            }
        } catch (Exception e) {
            log.warn("Falha ao buscar dados do CRM no dashboard", e);
        }

        // Top Produtos
        List<DashboardResumoDTO.TopProdutoDTO> top = vendaRepository.findTop5ProdutosMaisVendidosMesEmpresa(inicioMes, fimMes, empresaId);
        resumo.setTopProdutos(top != null ? top : new ArrayList<>());

        // Alertas Financeiros e Estoque
        if (resumo.getAlertas() == null) resumo.setAlertas(new ArrayList<>());
        if (resumo.getReceberAtrasado().compareTo(BigDecimal.ZERO) > 0) {
            resumo.getAlertas().add(new DashboardResumoDTO.AlertaDTO("FINANCEIRO", "Existem contas a receber vencidas. Verifique o relatrio."));
        }
        if (resumo.getProdutosBaixoEstoque() > 0) {
            resumo.getAlertas().add(new DashboardResumoDTO.AlertaDTO("ESTOQUE", resumo.getProdutosBaixoEstoque() + " produtos esto com estoque baixo ou zerado."));
        }

        // 1. Grfico Semanal
        List<DashboardResumoDTO.VendaSemanalDTO> graficoSemanal = new ArrayList<>();
        LocalDate hoje = fimMes.toLocalDate();
        for (int i = 6; i >= 0; i--) {
            LocalDate dataAlvo = hoje.minusDays(i);
            LocalDateTime inicioDia = dataAlvo.atStartOfDay();
            LocalDateTime fimDia = dataAlvo.atTime(LocalTime.MAX);

            BigDecimal totalDia = vendaRepository.sumTotalVendasPeriodoEmpresa(inicioDia, fimDia, empresaId).orElse(BigDecimal.ZERO);

            String diaSemana = dataAlvo.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            String diaFormatado = diaSemana.substring(0, 1).toUpperCase() + diaSemana.substring(1);

            graficoSemanal.add(new DashboardResumoDTO.VendaSemanalDTO(diaFormatado, totalDia));
        }
        resumo.setVendasSemanal(graficoSemanal);

        // 2. Gráfico de Categorias
        List<DashboardResumoDTO.CategoriaVendaDTO> categorias =
                vendaRepository.findCategoriasMaisVendidasPeriodoEmpresa(inicioMes, fimMes, empresaId);
        resumo.setVendasPorCategoria(categorias != null ? categorias : new ArrayList<>());

        return resumo;
    }

    private PeriodoDashboard resolverPeriodo(String periodo) {
        LocalDate hoje = LocalDate.now();
        String valor = periodo == null ? "MONTH" : periodo.trim().toUpperCase(Locale.ROOT);

        return switch (valor) {
            case "TODAY" -> new PeriodoDashboard(hoje.atStartOfDay(), LocalDateTime.now());
            case "7D" -> new PeriodoDashboard(hoje.minusDays(6).atStartOfDay(), LocalDateTime.now());
            case "30D" -> new PeriodoDashboard(hoje.minusDays(29).atStartOfDay(), LocalDateTime.now());
            case "MONTH" -> new PeriodoDashboard(hoje.withDayOfMonth(1).atStartOfDay(), LocalDateTime.now());
            default -> new PeriodoDashboard(hoje.withDayOfMonth(1).atStartOfDay(), LocalDateTime.now());
        };
    }

    private record PeriodoDashboard(LocalDateTime inicio, LocalDateTime fim) {
        java.time.Duration duracao() {
            return java.time.Duration.between(inicio, fim).plusNanos(1);
        }
    }

    public List<InsightDTO> getInsightsInteligentes() {
        List<InsightDTO> insights = new ArrayList<>();
        try {
            List<Produto> criticos = produtoRepository.findProdutosCriticosCurvaA();
            if (criticos != null && !criticos.isEmpty()) {
                Produto p = criticos.get(0);
                insights.add(new InsightDTO("ALERTA_ESTOQUE", "Risco de Ruptura (Curva A)", "O produto '" + p.getNome() + "' est com estoque baixo (" + p.getQuantidadeEstoque() + " un) e  um dos seus mais vendidos.", "GERAR PEDIDO DE COMPRA", "orange"));
            }

            LocalDateTime dataCorte = LocalDateTime.now().minusDays(90);
            List<Produto> parados = produtoRepository.findProdutosSemVendaDesde(dataCorte);
            if (parados != null && !parados.isEmpty()) {
                Produto p = parados.get(0);
                insights.add(new InsightDTO("DINHEIRO_PARADO", "Capital de Giro Travado", "Voc tem " + p.getQuantidadeEstoque() + " unidades de '" + p.getNome() + "' sem nenhuma venda h mais de 90 dias.", "CRIAR PROMOO (QUEIMA)", "red"));
            }

            insights.add(new InsightDTO("OPORTUNIDADE_VENDA", "Venda Casada (Cross-Sell)", "Notamos que muitos clientes que compram leo no levam o Filtro. Treine a equipe para oferecer o kit completo!", "VER RELATRIO DE VENDAS", "blue"));
        } catch (Exception e) {
            log.error("Erro ao montar insights inteligentes do dashboard", e);
        }
        return insights;
    }
}
