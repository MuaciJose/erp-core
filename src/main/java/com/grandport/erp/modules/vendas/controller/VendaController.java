package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.service.VendaService;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    @Autowired private VendaService service;
    @Autowired private VendaRepository repository;

    @PostMapping
    public ResponseEntity<Venda> realizarVenda(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.processarVenda(dto));
    }

    @PostMapping("/pedido")
    public ResponseEntity<Venda> criarPedido(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.criarPedido(dto));
    }

    @GetMapping("/fila-caixa")
    public ResponseEntity<List<Venda>> getFilaCaixa() {
        return ResponseEntity.ok(repository.findByStatus(StatusVenda.AGUARDANDO_PAGAMENTO));
    }

    @PostMapping("/{id}/pagar")
    public ResponseEntity<Venda> finalizarPagamento(@PathVariable Long id, @RequestBody List<PagamentoVendaDTO> pagamentos) {
        return ResponseEntity.ok(service.finalizarPagamentoPedido(id, pagamentos));
    }
}
