package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.PlanoConta;
import com.grandport.erp.modules.financeiro.repository.PlanoContaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    // 🚀 ATUALIZADO: Agora recebe o ID do pai e cria o vínculo na árvore
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> payload) {
        try {
            PlanoConta conta = new PlanoConta();
            conta.setDescricao((String) payload.get("descricao"));
            conta.setTipo((String) payload.get("tipo"));
            conta.setAceitaLancamento((Boolean) payload.get("aceitaLancamento"));

            if (payload.get("contaPaiId") != null) {
                Long paiId = Long.valueOf(payload.get("contaPaiId").toString());
                PlanoConta pai = repository.findById(paiId).orElse(null);
                conta.setContaPai(pai);
            }

            return ResponseEntity.ok(repository.save(conta));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao criar conta: " + e.getMessage()));
        }
    }

    // =====================================================================
    // 🚀 NOVO: ROTA DE EDIÇÃO (PUT)
    // =====================================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<PlanoConta> contaOpt = repository.findById(id);

        if (contaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PlanoConta conta = contaOpt.get();
        conta.setDescricao((String) payload.get("descricao"));
        // Permite mudar o tipo e lançamento apenas se não for um grupo com filhas
        conta.setTipo((String) payload.get("tipo"));
        conta.setAceitaLancamento((Boolean) payload.get("aceitaLancamento"));

        try {
            return ResponseEntity.ok(repository.save(conta));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao atualizar: " + e.getMessage()));
        }
    }

    // =====================================================================
    // 🚀 NOVO: ROTA DE EXCLUSÃO (DELETE) COM SEGURANÇA
    // =====================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        Optional<PlanoConta> contaOpt = repository.findById(id);

        if (contaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PlanoConta conta = contaOpt.get();

        // 🛡️ TRAVA DE SEGURANÇA: Não deixa apagar uma pasta que tem contas dentro
        if (conta.getFilhas() != null && !conta.getFilhas().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Não é possível excluir este grupo pois ele possui subcontas. Exclua as subcontas primeiro."));
        }

        try {
            repository.delete(conta);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Se cair aqui, geralmente é porque a conta já foi usada em alguma Despesa/Receita (Chave Estrangeira)
            return ResponseEntity.badRequest().body(Map.of("message", "Esta conta não pode ser excluída pois já possui lançamentos financeiros vinculados a ela."));
        }
    }
}