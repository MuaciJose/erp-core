package com.grandport.erp.modules.veiculo.controller;

import com.grandport.erp.modules.veiculo.dto.HistoricoVeiculoDTO;
import com.grandport.erp.modules.veiculo.dto.TransferenciaForcadaDTO;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.service.VeiculoService;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository; // 🚀 IMPORTAÇÃO NECESSÁRIA

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/veiculos")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class VeiculoController {

    @Autowired
    private VeiculoService service;

    @Autowired
    private VeiculoRepository veiculoRepository; // 🚀 INJEÇÃO DO REPOSITÓRIO

    // =========================================================
    // 🚀 A ROTA QUE FALTAVA PARA O TABLET FUNCIONAR!
    // =========================================================
    @GetMapping
    public ResponseEntity<List<Veiculo>> listarTodos() {
        return ResponseEntity.ok(veiculoRepository.findAll());
    }
    // =========================================================

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Veiculo>> listar(@PathVariable Long clienteId) {
        return ResponseEntity.ok(service.listarPorCliente(clienteId));
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<List<HistoricoVeiculoDTO>> getHistorico(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarHistorico(id));
    }

    @PostMapping("/cliente/{clienteId}")
    public ResponseEntity<?> cadastrar(@PathVariable Long clienteId, @RequestBody Veiculo veiculo) {
        try {
            return ResponseEntity.ok(service.cadastrar(clienteId, veiculo));
        } catch (VeiculoService.VeiculoConflitoException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("erro", "Veículo já cadastrado");
            response.put("veiculoId", e.getVeiculo().getId());
            response.put("placa", e.getVeiculo().getPlaca());
            response.put("donoAtualNome", e.getVeiculo().getCliente().getNome());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
    }

    @PostMapping("/{id}/transferir")
    public ResponseEntity<Void> transferir(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        service.transferirDono(id, payload.get("novoClienteId"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/transferencia-forcada")
    public ResponseEntity<Void> transferenciaForcada(@RequestBody TransferenciaForcadaDTO dto) {
        service.transferenciaForcada(dto);
        return ResponseEntity.ok().build();
    }
}