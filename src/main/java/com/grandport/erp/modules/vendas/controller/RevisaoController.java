package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.model.Revisao;
import com.grandport.erp.modules.vendas.repository.RevisaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/revisoes")
public class RevisaoController {

    @Autowired
    private RevisaoRepository repository;

    // 1. Buscar todas as revisões ativas para preencher o Kanban
    @GetMapping
    public ResponseEntity<List<Revisao>> listarAtivas() {
        // Busca tudo que não é 'CONCLUIDO' nem 'CANCELADO'
        List<Revisao> ativas = repository.findByStatusNotInOrderByDataPrevistaAsc(
                List.of("CONCLUIDO", "CANCELADO")
        );
        return ResponseEntity.ok(ativas);
    }

    // 2. Criar um novo alerta de revisão (Chamado lá na tela de Vendas)
    @PostMapping
    public ResponseEntity<Revisao> criarRevisao(@RequestBody Revisao novaRevisao) {
        if (novaRevisao.getStatus() == null) {
            novaRevisao.setStatus("PENDENTE");
        }
        Revisao salva = repository.save(novaRevisao);
        return ResponseEntity.ok(salva);
    }

    // 3. Atualizar o status (Quando o atendente clica em "Whatsapp" ou "Concluído")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return repository.findById(id).map(revisao -> {
            revisao.setStatus(payload.get("status"));
            repository.save(revisao);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}