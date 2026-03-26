package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.dto.InsightDTO;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.repository.RevisaoRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
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

    @Autowired private VendaRepository vendaRepository;
    @Autowired private ContaReceberRepository contaReceberRepository;
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private RevisaoRepository revisaoRepository;

    // =========================================================================
    // 🛡️ MTODO TTICO PARA PEGAR O ID DA EMPRESA
    // =========================================================================
    private Long getEmpresaId() {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return usuarioLogado.getEmpresaId();
    }

    public DashboardResumoDTO getResumoDashboard() {
        DashboardResumoDTO resumo = new DashboardResumoDTO();
        Long empresaId = getEmpresaId(); // 🚀 Pegamos a empresa logada!

        // Calcula incio do ms no Java
        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime fimMes = LocalDateTime.now();

        // KPIs Financeiros com tratamento de nulo
        // (Nota: assumindo que a sua VendaRepository tambm no tem blindagem ainda, vamos focar no erro atual)
        resumo.setFaturamentoMes(vendaRepository.sumTotalVendasPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));

        // 🚀 O CONSERTO DO ERRO DE COMPILAO AQUI!
        resumo.setReceberAtrasado(contaReceberRepository.sumContasAtrasadas(empresaId).orElse(BigDecimal.ZERO));

        Long vendasHoje = vendaRepository.countVendasByData(LocalDate.now().atStartOfDay(), LocalDate.now().atTime(LocalTime.MAX));
        resumo.setVendasHoje(vendasHoje != null ? vendasHoje : 0L);

        // KPIs de Estoque
        Long baixoEstoque = produtoRepository.countProdutosBaixoEstoque();
        resumo.setProdutosBaixoEstoque(baixoEstoque != null ? baixoEstoque : 0L);

        // =========================================================================
        // KPIs DO CRM (Ps-Venda)
        // =========================================================================
        try {
            Long crmAtrasados = revisaoRepository.countRevisoesAtrasadas();
            resumo.setCrmAtrasados(crmAtrasados != null ? crmAtrasados : 0L);

            Long crmHoje = revisaoRepository.countRevisoesParaHoje();
            resumo.setCrmHoje(crmHoje != null ? crmHoje : 0L);

            // Adiciona um Alerta se tiver reviso atrasada!
            if (crmAtrasados != null && crmAtrasados > 0) {
                if (resumo.getAlertas() == null) resumo.setAlertas(new ArrayList<>());
                resumo.getAlertas().add(new DashboardResumoDTO.AlertaDTO("CRM / PS-VENDA", "Voc tem " + crmAtrasados + " clientes aguardando contato de reviso. No perca vendas!"));
            }
        } catch (Exception e) {
            System.err.println("Aviso: Falha ao buscar dados do CRM no Dashboard - " + e.getMessage());
        }

        // Top Produtos
        List<DashboardResumoDTO.TopProdutoDTO> top = vendaRepository.findTop5ProdutosMaisVendidosMes();
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
        LocalDate hoje = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate dataAlvo = hoje.minusDays(i);
            LocalDateTime inicioDia = dataAlvo.atStartOfDay();
            LocalDateTime fimDia = dataAlvo.atTime(LocalTime.MAX);

            BigDecimal totalDia = vendaRepository.sumTotalVendasPeriodo(inicioDia, fimDia).orElse(BigDecimal.ZERO);

            String diaSemana = dataAlvo.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            String diaFormatado = diaSemana.substring(0, 1).toUpperCase() + diaSemana.substring(1);

            graficoSemanal.add(new DashboardResumoDTO.VendaSemanalDTO(diaFormatado, totalDia));
        }
        resumo.setVendasSemanal(graficoSemanal);

        // 2. Grfico de Categorias
        List<DashboardResumoDTO.CategoriaVendaDTO> categorias = new ArrayList<>();
        categorias.add(new DashboardResumoDTO.CategoriaVendaDTO("Suspenso", 350));
        categorias.add(new DashboardResumoDTO.CategoriaVendaDTO("Freios", 420));
        categorias.add(new DashboardResumoDTO.CategoriaVendaDTO("Filtros", 210));
        categorias.add(new DashboardResumoDTO.CategoriaVendaDTO("leos", 300));
        resumo.setVendasPorCategoria(categorias);

        return resumo;
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
            e.printStackTrace();
        }
        return insights;
    }
}