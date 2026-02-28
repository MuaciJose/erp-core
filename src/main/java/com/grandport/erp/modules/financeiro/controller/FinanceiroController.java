package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.ContaReceberDTO;
import com.grandport.erp.modules.financeiro.dto.ExtratoParceiroDTO;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/extrato/{parceiroId}")
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(service.gerarExtratoParceiro(parceiroId));
    }
}
