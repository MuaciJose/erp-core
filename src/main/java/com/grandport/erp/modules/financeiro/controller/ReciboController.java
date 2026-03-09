package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.Recibo;
import com.grandport.erp.modules.financeiro.repository.ReciboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financeiro/recibos")
public class ReciboController {

    @Autowired
    private ReciboRepository repository;

    // 🚀 SALVAR NOVO RECIBO
    @PostMapping
    public ResponseEntity<Recibo> salvar(@RequestBody Recibo recibo) {
        Recibo salvo = repository.save(recibo);
        return ResponseEntity.ok(salvo);
    }

    // 🚀 LISTAR HISTÓRICO
    @GetMapping
    public List<Recibo> listarTodos() {
        return repository.findAllByOrderByDataRegistroDesc();
    }

    // 🚀 DELETAR RECIBO DO HISTÓRICO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}