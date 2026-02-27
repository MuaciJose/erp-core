package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.ResumoFinanceiroDTO;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/financeiro/fluxo-caixa")
@Tag(name = "Financeiro - Fluxo de Caixa")
public class FluxoCaixaController {

    @Autowired
    private MovimentacaoCaixaRepository repository;

    @GetMapping("/extrato")
    @Operation(summary = "Lista todas as entradas e saídas por período")
    public List<MovimentacaoCaixa> listarExtrato(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return repository.findByDataMovimentacaoBetween(inicio, fim);
    }

    @GetMapping("/resumo")
    @Operation(summary = "Gera o resumo de saldo (Entradas vs Saídas)")
    public ResumoFinanceiroDTO obterResumo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        
        List<MovimentacaoCaixa> movs = repository.findByDataMovimentacaoBetween(inicio, fim);

        BigDecimal entradas = movs.stream()
                .filter(m -> "ENTRADA".equals(m.getTipo()))
                .map(MovimentacaoCaixa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saidas = movs.stream()
                .filter(m -> "SAIDA".equals(m.getTipo()))
                .map(MovimentacaoCaixa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ResumoFinanceiroDTO(
                entradas,
                saidas,
                entradas.subtract(saidas),
                movs.size()
        );
    }
}