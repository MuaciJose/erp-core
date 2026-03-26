package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.PlanoConta;
import com.grandport.erp.modules.financeiro.repository.PlanoContaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/planocontas")
public class PlanoContaController {

    @Autowired
    private PlanoContaRepository repository;

    // ✅ HELPER: Obter empresa atual do usuário autenticado
    private Long obterEmpresaAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.grandport.erp.modules.usuario.model.Usuario) {
            com.grandport.erp.modules.usuario.model.Usuario usuario = 
                (com.grandport.erp.modules.usuario.model.Usuario) auth.getPrincipal();
            Long empresaId = usuario.getEmpresaId();
            if (empresaId != null) {
                return empresaId;
            }
        }
        throw new RuntimeException("Usuário não autenticado ou empresa não configurada");
    }

    @GetMapping
    public ResponseEntity<List<PlanoConta>> getArvore() {
        // ✅ MULTI-EMPRESA: Retorna apenas as contas raiz da empresa atual
        Long empresaId = obterEmpresaAtual();
        return ResponseEntity.ok(repository.findByEmpresaIdAndContaPaiIsNull(empresaId));
    }

    @GetMapping("/lancamentos")
    public ResponseEntity<List<PlanoConta>> getContasLancamento(@RequestParam String tipo) {
        // ✅ MULTI-EMPRESA: Retorna apenas as contas de lançamento da empresa atual
        Long empresaId = obterEmpresaAtual();
        return ResponseEntity.ok(repository.findByEmpresaIdAndTipoAndAceitaLancamentoTrue(empresaId, tipo));
    }

    // 🚀 ATUALIZADO: Agora recebe o ID do pai e cria o vínculo na árvore
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> payload) {
        try {
            Long empresaId = obterEmpresaAtual();
            PlanoConta conta = new PlanoConta();
            conta.setDescricao((String) payload.get("descricao"));
            conta.setTipo((String) payload.get("tipo"));
            conta.setAceitaLancamento((Boolean) payload.get("aceitaLancamento"));
            conta.setEmpresaId(empresaId);  // ✅ CRÍTICO: Setando empresa

            if (payload.get("contaPaiId") != null) {
                Long paiId = Long.valueOf(payload.get("contaPaiId").toString());
                // ✅ Validar que o pai pertence à mesma empresa
                PlanoConta pai = repository.findByEmpresaIdAndId(empresaId, paiId).orElse(null);
                
                if (pai == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Plano pai não encontrado ou pertence a outra empresa"));
                }
                
                conta.setContaPai(pai);
            }

            return ResponseEntity.ok(repository.save(conta));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao criar conta: " + e.getMessage()));
        }
    }

    // =====================================================================
    // 🚀 NOVO: ROTA DE EDIÇÃO (PUT)
    // =====================================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Long empresaId = obterEmpresaAtual();
            // ✅ Validar que a conta pertence à empresa atual
            Optional<PlanoConta> contaOpt = repository.findByEmpresaIdAndId(empresaId, id);

            if (contaOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Conta não encontrada ou pertence a outra empresa"));
            }

            PlanoConta conta = contaOpt.get();
            conta.setDescricao((String) payload.get("descricao"));
            conta.setTipo((String) payload.get("tipo"));
            conta.setAceitaLancamento((Boolean) payload.get("aceitaLancamento"));

            return ResponseEntity.ok(repository.save(conta));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao atualizar: " + e.getMessage()));
        }
    }

    // =====================================================================
    // 🚀 NOVO: ROTA DE EXCLUSÃO (DELETE) COM SEGURANÇA
    // =====================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            Long empresaId = obterEmpresaAtual();
            // ✅ Validar que a conta pertence à empresa atual
            Optional<PlanoConta> contaOpt = repository.findByEmpresaIdAndId(empresaId, id);

            if (contaOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Conta não encontrada ou pertence a outra empresa"));
            }

            PlanoConta conta = contaOpt.get();

            // 🛡️ TRAVA DE SEGURANÇA: Não deixa apagar uma pasta que tem contas dentro
            if (conta.getFilhas() != null && !conta.getFilhas().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Não é possível excluir este grupo pois ele possui subcontas. Exclua as subcontas primeiro."));
            }

            repository.delete(conta);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Esta conta não pode ser excluída pois já possui lançamentos financeiros vinculados a ela."));
        }
    }
}