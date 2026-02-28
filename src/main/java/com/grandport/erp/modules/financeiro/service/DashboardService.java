package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;

@Service
public class DashboardService {

    @Autowired private VendaRepository vendaRepository;
    @Autowired private ContaReceberRepository contaReceberRepository;
    @Autowired private ProdutoRepository produtoRepository;

    public DashboardResumoDTO getResumoDashboard() {
        DashboardResumoDTO resumo = new DashboardResumoDTO();

        // KPIs Financeiros
        resumo.setFaturamentoMes(vendaRepository.sumTotalVendasMesAtual().orElse(BigDecimal.ZERO));
        resumo.setReceberAtrasado(contaReceberRepository.sumContasAtrasadas().orElse(BigDecimal.ZERO));
        resumo.setVendasHoje(vendaRepository.countVendasByData(LocalDate.now().atStartOfDay(), LocalDate.now().atTime(LocalTime.MAX)));

        // KPIs de Estoque
        resumo.setProdutosBaixoEstoque(produtoRepository.countProdutosBaixoEstoque());
        resumo.setTopProdutos(vendaRepository.findTop5ProdutosMaisVendidosMes());
        
        // Alertas (lógica simplificada)
        resumo.setAlertas(new ArrayList<>());
        if (resumo.getReceberAtrasado().compareTo(BigDecimal.ZERO) > 0) {
            DashboardResumoDTO.AlertaDTO alerta = new DashboardResumoDTO.AlertaDTO();
            alerta.setTipo("FINANCEIRO");
            alerta.setMsg("Existem contas a receber vencidas. Verifique o relatório.");
            resumo.getAlertas().add(alerta);
        }
        if (resumo.getProdutosBaixoEstoque() > 0) {
            DashboardResumoDTO.AlertaDTO alerta = new DashboardResumoDTO.AlertaDTO();
            alerta.setTipo("ESTOQUE");
            alerta.setMsg(resumo.getProdutosBaixoEstoque() + " produtos estão com estoque baixo ou zerado.");
            resumo.getAlertas().add(alerta);
        }

        return resumo;
    }
}
