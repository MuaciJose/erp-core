package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.service.VendaService;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.service.WhatsAppService;

// 🚀 IMPORTAÇÃO DO SERVIÇO FISCAL ADICIONADA
import com.grandport.erp.modules.fiscal.service.NfeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    @Autowired private VendaService service;
    @Autowired private VendaRepository repository;
    @Autowired private WhatsAppService whatsAppService;

    // 🚀 INJEÇÃO DO SERVIÇO DE NOTA FISCAL
    @Autowired private NfeService nfeService;

    // =========================================================================
    // 🚀 ENDPOINT DO WHATSAPP
    // =========================================================================
    @PostMapping("/{id}/enviar-whatsapp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> enviarReciboWhatsApp(@PathVariable Long id) {
        try {
            whatsAppService.enviarReciboPdfPorWhatsApp(id);
            return ResponseEntity.ok("{\"message\": \"Documento enviado com sucesso pelo WhatsApp!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping
    public ResponseEntity<List<Venda>> listarTodas() {
        return ResponseEntity.ok(repository.findAll(Sort.by(Sort.Direction.DESC, "dataHora")));
    }

    @PostMapping("/orcamento")
    public ResponseEntity<Venda> salvarOrcamento(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.salvarOrcamento(dto));
    }

    // 🚀 Rota unificada para atualizar qualquer tipo de venda
    @PutMapping("/{id}")
    public ResponseEntity<Venda> atualizarVenda(@PathVariable Long id, @RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarVenda(id, dto));
    }

    @PostMapping("/pedido")
    public ResponseEntity<Venda> criarPedido(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.criarPedido(dto));
    }

    @GetMapping("/orcamentos")
    public ResponseEntity<List<Venda>> listarOrcamentos() {
        return ResponseEntity.ok(repository.findByStatus(StatusVenda.ORCAMENTO));
    }

    @GetMapping("/fila-caixa")
    public ResponseEntity<List<Venda>> getFilaCaixa() {
        return ResponseEntity.ok(repository.findByStatus(StatusVenda.AGUARDANDO_PAGAMENTO));
    }

    // =========================================================================
    // 🚀 PAGAMENTO NO CAIXA (Apenas recebe o valor, NÃO emite a NF-e)
    // =========================================================================
    @PostMapping("/{id}/pagar")
    public ResponseEntity<Venda> finalizarPagamento(@PathVariable Long id, @RequestBody List<PagamentoVendaDTO> pagamentos) {
        // 1. Processa o pagamento financeiro no caixa
        Venda vendaPaga = service.finalizarPagamentoPedido(id, pagamentos);

        // 2. Retorna a venda paga para o React (O Recibo é impresso na hora)
        // A nota fiscal fica aguardando o clique de "Autorizar" na tela do Gerenciador Fiscal
        return ResponseEntity.ok(vendaPaga);
    }

    @PostMapping("/{id}/devolver")
    public ResponseEntity<Venda> devolverAoVendedor(@PathVariable Long id) {
        return ResponseEntity.ok(service.devolverAoVendedor(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluirVenda(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/whatsapp/status")
    public ResponseEntity<Map<String, Object>> checarStatusWhatsApp() {
        return ResponseEntity.ok(whatsAppService.consultarStatusInstancia());
    }

    // =========================================================================
    // 🚀 ROTA PARA BUSCAR UMA VENDA ESPECÍFICA PELO ID (Usada na Reimpressão)
    // =========================================================================
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarVendaPorId(@PathVariable Long id) {
        try {
            Optional<Venda> venda = repository.findById(id);

            if (venda.isPresent()) {
                return ResponseEntity.ok(venda.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", "Venda não encontrada"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("mensagem", e.getMessage()));
        }
    }

    // =========================================================================
    // 🚀 ENDPOINT DE CANCELAMENTO DE NFE
    // =========================================================================
    @PostMapping("/{id}/cancelar-nfe")
    public ResponseEntity<?> cancelarNotaFiscal(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String justificativa = payload.get("justificativa");

        if (justificativa == null || justificativa.trim().length() < 15) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "A justificativa deve conter no mínimo 15 caracteres."));
        }

        try {
            // 🚀 LIGAÇÃO REAL COM O SERVIÇO FISCAL ATIVADA
            nfeService.cancelarNfeDaVenda(id, justificativa);

            return ResponseEntity.ok(Map.of("message", "Nota Fiscal cancelada com sucesso na SEFAZ."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Rejeição SEFAZ: " + e.getMessage()));
        }
    }
}