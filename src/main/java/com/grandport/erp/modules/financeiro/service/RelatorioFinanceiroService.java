package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RelatorioFinanceiroService {

    @Autowired
    private MovimentacaoCaixaRepository caixaRepo;

    public BigDecimal calcularSaldoPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        List<MovimentacaoCaixa> movs = caixaRepo.findByDataMovimentacaoBetween(inicio, fim);
        
        BigDecimal entradas = movs.stream()
            .filter(m -> m.getTipo().equals("ENTRADA"))
            .map(MovimentacaoCaixa::getValor)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saidas = movs.stream()
            .filter(m -> m.getTipo().equals("SAIDA"))
            .map(MovimentacaoCaixa::getValor)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return entradas.subtract(saidas); // O Lucro Líquido do período
    }
}
