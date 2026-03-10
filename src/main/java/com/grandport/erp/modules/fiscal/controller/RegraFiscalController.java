package com.grandport.erp.modules.fiscal.controller;

import com.grandport.erp.modules.fiscal.model.RegraFiscal;
import com.grandport.erp.modules.fiscal.service.RegraFiscalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fiscal/regras")
public class RegraFiscalController {

    @Autowired
    private RegraFiscalService service;

    @GetMapping
    public ResponseEntity<List<RegraFiscal>> listar() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegraFiscal> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<RegraFiscal> criar(@RequestBody RegraFiscal regraFiscal) {
        return ResponseEntity.ok(service.salvar(regraFiscal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegraFiscal> atualizar(@PathVariable Long id, @RequestBody RegraFiscal regraFiscal) {
        regraFiscal.setId(id); // Garante que vai atualizar a regra correta
        return ResponseEntity.ok(service.salvar(regraFiscal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}