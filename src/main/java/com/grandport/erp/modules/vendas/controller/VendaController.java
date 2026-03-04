package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.service.VendaService;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.service.WhatsAppService; // IMPORTANTE
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // IMPORTANTE
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    @Autowired private VendaService service;
    @Autowired private VendaRepository repository;
    @Autowired private WhatsAppService whatsAppService; // ADICIONADO

    // =========================================================================
    // 🚀 ENDPOINT DO WHATSAPP NO LUGAR CERTO
    // =========================================================================
    @PostMapping("/{id}/whatsapp")
    @PreAuthorize("isAuthenticated()") // Libera para qualquer um que tenha feito login
    public ResponseEntity<String> enviarReciboWhatsApp(@PathVariable Long id) {
        try {
            whatsAppService.enviarReciboPdfPorWhatsApp(id);
            return ResponseEntity.ok("Recibo enviado com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    @PutMapping("/orcamento/{id}")
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

    @PostMapping("/{id}/pagar")
    public ResponseEntity<Venda> finalizarPagamento(@PathVariable Long id, @RequestBody List<PagamentoVendaDTO> pagamentos) {
        return ResponseEntity.ok(service.finalizarPagamentoPedido(id, pagamentos));
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
}