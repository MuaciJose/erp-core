package com.grandport.erp.modules.parceiro.controller;

import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.parceiro.dto.BrasilApiCepDTO;
import com.grandport.erp.modules.parceiro.dto.BrasilApiCnpjDTO;
import com.grandport.erp.modules.parceiro.dto.HistoricoComprasClienteDTO;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.parceiro.service.ConsultaDocumentoService;
import com.grandport.erp.modules.parceiro.service.ParceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parceiros")
public class ParceiroController {

    @Autowired private ParceiroRepository repository;
    @Autowired private ParceiroService service;
    @Autowired private ConsultaDocumentoService consultaService;
    @Autowired private EmpresaContextService empresaContextService;

    @GetMapping
    public ResponseEntity<List<Parceiro>> listar(@RequestParam(required = false) String termo) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        if (termo != null && !termo.isEmpty()) {
            return ResponseEntity.ok(repository.buscarPorTermo(termo, empresaId));
        }
        return ResponseEntity.ok(repository.findByEmpresaId(empresaId));
    }

    @GetMapping("/{id}/historico-compras")
    public ResponseEntity<List<HistoricoComprasClienteDTO>> getHistoricoCompras(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarHistoricoCompras(id));
    }

    @PostMapping
    public ResponseEntity<Parceiro> criar(@RequestBody Parceiro parceiro) {
        return ResponseEntity.ok(service.criar(parceiro));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Parceiro> atualizar(@PathVariable Long id, @RequestBody Parceiro parceiro) {
        return ResponseEntity.ok(service.atualizar(id, parceiro));
    }

    @GetMapping("/consulta-cnpj/{cnpj}")
    public ResponseEntity<BrasilApiCnpjDTO> consultarCnpj(@PathVariable String cnpj) {
        BrasilApiCnpjDTO dados = consultaService.consultarCnpj(cnpj);
        if (dados != null) {
            return ResponseEntity.ok(dados);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/consulta-cep/{cep}")
    public ResponseEntity<BrasilApiCepDTO> consultarCep(@PathVariable String cep) {
        BrasilApiCepDTO dados = consultaService.consultarCep(cep);
        if (dados != null) {
            return ResponseEntity.ok(dados);
        }
        return ResponseEntity.notFound().build();
    }
}
