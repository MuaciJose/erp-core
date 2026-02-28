package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/financeiro")
public class FinanceiroController {

    @Autowired
    private FinanceiroService service;

    @GetMapping("/contas-a-receber")
    public ResponseEntity<List<ContaReceberDTO>> getContasAReceber() {
        return ResponseEntity.ok(service.listarContasAReceber());
    }

    @GetMapping("/contas-a-pagar")
    public ResponseEntity<List<ContaPagarDTO>> getContasAPagar() {
        return ResponseEntity.ok(service.listarContasAPagar());
    }

    @GetMapping("/contas-bancarias")
    public ResponseEntity<List<ContaBancaria>> getContasBancarias() {
        return ResponseEntity.ok(service.listarContasBancarias());
    }

    @PostMapping("/contas-bancarias")
    public ResponseEntity<ContaBancaria> criarContaBancaria(@RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(service.criarContaBancaria(conta));
    }

    @PostMapping("/contas-bancarias/transferir")
    public ResponseEntity<Void> transferir(@RequestBody TransferenciaDTO dto) {
        service.transferirEntreContas(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contas-pagar/manual")
    public ResponseEntity<ContaPagar> registrarDespesaManual(@RequestBody DespesaManualDTO dto) {
        return ResponseEntity.ok(service.registrarDespesaManual(dto));
    }

    @PatchMapping("/contas-a-pagar/{id}/baixar")
    public ResponseEntity<Void> baixarContaPagar(@PathVariable Long id) {
        service.baixarContaPagar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/contas-a-pagar/{id}/liquidar")
    public ResponseEntity<Void> liquidarContaPagar(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        service.liquidarContaPagar(id, payload.get("contaBancariaId"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/extrato/{parceiroId}")
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(service.gerarExtratoParceiro(parceiroId));
    }

    @GetMapping("/dre")
    public ResponseEntity<DreDTO> getDre(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth mesAno) {
        return ResponseEntity.ok(service.calcularDre(mesAno));
    }
}
