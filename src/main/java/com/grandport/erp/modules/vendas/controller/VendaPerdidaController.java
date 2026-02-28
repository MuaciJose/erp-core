package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.dto.VendaPerdidaRankingDTO;
import com.grandport.erp.modules.vendas.model.VendaPerdida;
import com.grandport.erp.modules.vendas.repository.VendaPerdidaRepository;
import com.grandport.erp.modules.vendas.service.VendaPerdidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendas-perdidas")
public class VendaPerdidaController {

    @Autowired
    private VendaPerdidaRepository repository;

    @Autowired
    private VendaPerdidaService service;

    @PostMapping
    public ResponseEntity<VendaPerdida> registrarVendaPerdida(@RequestBody Map<String, String> payload) {
        String descricao = payload.get("descricaoPeca");
        if (descricao == null || descricao.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        VendaPerdida vendaPerdida = new VendaPerdida();
        vendaPerdida.setDescricaoPeca(descricao);
        
        VendaPerdida saved = repository.save(vendaPerdida);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<VendaPerdidaRankingDTO>> getRanking() {
        return ResponseEntity.ok(service.getRankingVendasPerdidas());
    }
}
