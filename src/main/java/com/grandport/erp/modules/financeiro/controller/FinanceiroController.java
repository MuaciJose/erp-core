package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.ContaPagarDTO;
import com.grandport.erp.modules.financeiro.dto.ContaReceberDTO;
import com.grandport.erp.modules.financeiro.dto.DespesaManualDTO;
import com.grandport.erp.modules.financeiro.dto.ExtratoParceiroDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/contas-pagar/manual")
    public ResponseEntity<ContaPagar> registrarDespesaManual(@RequestBody DespesaManualDTO dto) {
        return ResponseEntity.ok(service.registrarDespesaManual(dto));
    }

    @PatchMapping("/contas-a-pagar/{id}/baixar")
    public ResponseEntity<Void> baixarContaPagar(@PathVariable Long id) {
        service.baixarContaPagar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/extrato/{parceiroId}")
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(service.gerarExtratoParceiro(parceiroId));
    }
}
