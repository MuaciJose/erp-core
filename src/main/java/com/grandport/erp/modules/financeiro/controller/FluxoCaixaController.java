package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.FluxoCaixaResponseDTO;
import com.grandport.erp.modules.financeiro.dto.ResumoFinanceiroDTO;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import com.grandport.erp.modules.financeiro.service.FluxoCaixaService;
import com.grandport.erp.modules.usuario.model.Usuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/financeiro/fluxo-caixa")
@Tag(name = "Financeiro - Caixa e Projeções")
public class FluxoCaixaController {

    @Autowired
    private MovimentacaoCaixaRepository repository;

    @Autowired
    private FluxoCaixaService fluxoCaixaService; // 🚀 O NOVO MOTOR DE PREVISÃO DO FUTURO

    // =========================================================================
    // 🛡️ 1. EXTRATO BLINDADO (O Passado/Presente da Empresa)
    // =========================================================================
    @GetMapping("/extrato")
    @Operation(summary = "Lista todas as entradas e saídas reais da Empresa")
    public List<MovimentacaoCaixa> listarExtrato(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {

        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔐 A MURALHA: Só procura os movimentos da empresa do utilizador!
        return repository.findByEmpresaIdAndDataMovimentacaoBetween(usuarioLogado.getEmpresaId(), inicio, fim);
    }

    // =========================================================================
    // 🛡️ 2. RESUMO BLINDADO (Totais do Passado/Presente)
    // =========================================================================
    @GetMapping("/resumo")
    @Operation(summary = "Gera o resumo de saldo real (Entradas vs Saídas)")
    public ResumoFinanceiroDTO obterResumo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {

        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔐 A MURALHA NOVAMENTE!
        List<MovimentacaoCaixa> movs = repository.findByEmpresaIdAndDataMovimentacaoBetween(usuarioLogado.getEmpresaId(), inicio, fim);

        BigDecimal entradas = movs.stream()
                .filter(m -> "ENTRADA".equals(m.getTipo()))
                .map(MovimentacaoCaixa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saidas = movs.stream()
                .filter(m -> "SAIDA".equals(m.getTipo()))
                .map(MovimentacaoCaixa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ResumoFinanceiroDTO(entradas, saidas, entradas.subtract(saidas), movs.size());
    }

    // =========================================================================
    // 🚀 3. A NOVA PROJEÇÃO DE FLUXO (O Futuro baseado no T2Ti)
    // =========================================================================
    @GetMapping("/projecao")
    @Operation(summary = "Gera a projeção futura de saldo cruzando Contas a Pagar e Receber")
    public ResponseEntity<FluxoCaixaResponseDTO> obterProjecao(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        // Se não mandar datas, foca nos próximos 30 dias a partir de hoje
        if (dataInicio == null) dataInicio = LocalDate.now();
        if (dataFim == null) dataFim = dataInicio.plusDays(30);

        if (dataFim.isBefore(dataInicio)) {
            throw new IllegalArgumentException("A data de fim não pode ser anterior à data de início.");
        }

        // Chama aquele serviço que cruzava os dados que fizemos na mensagem anterior!
        FluxoCaixaResponseDTO projecao = fluxoCaixaService.gerarProjecao(dataInicio, dataFim);

        return ResponseEntity.ok(projecao);
    }
}