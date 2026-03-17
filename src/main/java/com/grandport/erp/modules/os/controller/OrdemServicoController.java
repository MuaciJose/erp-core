package com.grandport.erp.modules.os.controller;

import com.grandport.erp.modules.os.dto.OsRequestDTO;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.service.OrdemServicoService;
import com.grandport.erp.modules.os.service.OsFiscalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/os")
public class OrdemServicoController {

    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private OrdemServicoService osService;
    @Autowired private OsFiscalService osFiscalService;

    @GetMapping
    public List<OrdemServico> listarTodas() {
        return osRepository.findAll();
    }

    @GetMapping("/{id}")
    public OrdemServico buscarPorId(@PathVariable Long id) {
        return osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
    }

    @PostMapping
    public OrdemServico criarNovaOS(@RequestBody OsRequestDTO dto) {
        return osService.salvarRascunho(dto, null); // 🚀 Passa pelo motor com Auditoria
    }

    @PutMapping("/{id}")
    public OrdemServico atualizarOS(@PathVariable Long id, @RequestBody OsRequestDTO dto) {
        return osService.salvarRascunho(dto, id); // 🚀 Passa pelo motor com Auditoria
    }

    @PatchMapping("/{id}/status")
    public OrdemServico mudarStatus(@PathVariable Long id, @RequestParam String status) {
        OrdemServico os = osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.valueOf(status));
        return osRepository.save(os);
    }

    // Rota que o Gerente usa na tela de OS (Aguardando Pagamento)
    @PostMapping("/{id}/enviar-caixa")
    public OrdemServico enviarParaCaixa(@PathVariable Long id) {
        OrdemServico os = osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));

        // 🚀 Removemos a baixa de estoque daqui para não duplicar,
        // pois a baixa real e a auditoria ocorrem no momento do faturamento final (Caixa).
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.AGUARDANDO_PAGAMENTO);
        return osRepository.save(os);
    }

    // Rota que o Operador de Caixa usa
    @PostMapping("/{id}/pagar")
    public OrdemServico pagarOS(@PathVariable Long id, @RequestBody Object pagamentos) {
        // 🚀 Agora sim! Chama o nosso motor blindado que baixa o estoque,
        // checa quantidades e grava na Auditoria.
        return osService.faturarOS(id);
    }

    // ==========================================
    // 🚀 MÓDULO FISCAL (CHAVE SELETORA: 55 OU 65)
    // ==========================================

    @PostMapping("/{id}/fiscal/emitir-pecas")
    public org.springframework.http.ResponseEntity<?> emitirNfePecas(
            @PathVariable Long id,
            @RequestParam(defaultValue = "55") String modelo) { // 🚀 CHAVE SELETORA AQUI!
        try {
            // O React vai enviar o modelo via URL: /api/os/1/fiscal/emitir-pecas?modelo=65
            return org.springframework.http.ResponseEntity.ok(osFiscalService.emitirFiscalPecas(id, modelo));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/fiscal/nfse-servicos")
    public org.springframework.http.ResponseEntity<?> emitirNfseServicos(@PathVariable Long id) {
        try {
            return org.springframework.http.ResponseEntity.ok(osFiscalService.emitirNfseServicos(id));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}