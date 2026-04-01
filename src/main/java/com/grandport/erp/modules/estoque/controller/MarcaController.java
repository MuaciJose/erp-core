package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.estoque.model.Marca;
import com.grandport.erp.modules.estoque.repository.MarcaRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marcas")
@Tag(name = "Estoque - Marcas")
public class MarcaController {

    @Autowired private MarcaRepository repository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private EmpresaContextService empresaContextService;

    @PostMapping
    public ResponseEntity<Marca> criar(@RequestBody Marca marca) {
        marca.setEmpresaId(empresaContextService.getRequiredEmpresaId());
        Marca salva = repository.save(marca);
        auditoriaService.registrar("ESTOQUE", "CRIACAO_MARCA", "Cadastrou a marca: " + salva.getNome());
        return ResponseEntity.ok(salva);
    }

    @GetMapping
    public List<Marca> listar() {
        return repository.findByEmpresaIdOrderByNomeAsc(empresaContextService.getRequiredEmpresaId());
    }

    @GetMapping("/buscar")
    public List<Marca> buscar(@RequestParam String nome) {
        return repository.findByEmpresaIdAndNomeContainingIgnoreCase(empresaContextService.getRequiredEmpresaId(), nome);
    }
}
