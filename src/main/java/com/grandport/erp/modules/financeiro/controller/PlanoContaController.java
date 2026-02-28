package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.PlanoConta;
import com.grandport.erp.modules.financeiro.repository.PlanoContaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planocontas")
public class PlanoContaController {

    @Autowired
    private PlanoContaRepository repository;

    @GetMapping
    public ResponseEntity<List<PlanoConta>> getArvore() {
        // Retorna apenas as contas raiz, o Jackson cuidará de serializar as filhas recursivamente
        return ResponseEntity.ok(repository.findByContaPaiIsNull());
    }

    @GetMapping("/lancamentos")
    public ResponseEntity<List<PlanoConta>> getContasLancamento(@RequestParam String tipo) {
        return ResponseEntity.ok(repository.findByTipoAndAceitaLancamentoTrue(tipo));
    }

    @PostMapping
    public ResponseEntity<PlanoConta> criar(@RequestBody PlanoConta conta) {
        return ResponseEntity.ok(repository.save(conta));
    }
}
