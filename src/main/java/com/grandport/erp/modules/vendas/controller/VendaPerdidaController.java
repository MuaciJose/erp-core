package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.dto.VendaPerdidaRankingDTO;
import com.grandport.erp.modules.vendas.model.VendaPerdida;
import com.grandport.erp.modules.vendas.repository.VendaPerdidaRepository;
import com.grandport.erp.modules.vendas.service.VendaPerdidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_VENDAS', 'ROLE_CRM')")
    public ResponseEntity<?> registrarVendaPerdida(@RequestBody Map<String, Object> payload) {

        // 🚀 O Java agora lê os dados avançados que o React manda
        String motivo = payload.containsKey("motivo") && payload.get("motivo") != null
                ? payload.get("motivo").toString() : "SEM MOTIVO";

        String observacoes = payload.containsKey("observacoes") && payload.get("observacoes") != null
                ? payload.get("observacoes").toString() : "Sem observações";

        String valorTotal = payload.containsKey("valorTotal") && payload.get("valorTotal") != null
                ? payload.get("valorTotal").toString() : "0.00";

        // 🚀 Montamos um relatório tático para salvar no banco
        String descricaoFinal = String.format("Motivo: [%s] | Obs: %s | Valor Perdido: R$ %s",
                motivo, observacoes, valorTotal);

        VendaPerdida vendaPerdida = new VendaPerdida();

        // Salvamos todo esse relatório dentro da variável que o banco já conhece
        vendaPerdida.setDescricaoPeca(descricaoFinal);

        VendaPerdida saved = repository.save(vendaPerdida);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/ranking")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CRM')") // Perfis administrativos e comerciais
    public ResponseEntity<List<VendaPerdidaRankingDTO>> getRanking() {
        return ResponseEntity.ok(service.getRankingVendasPerdidas());
    }
}
