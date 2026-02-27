package com.grandport.erp.modules.estoque.controller;

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

    @Autowired
    private MarcaRepository repository;

    @PostMapping
    public ResponseEntity<Marca> criar(@RequestBody Marca marca) {
        return ResponseEntity.ok(repository.save(marca));
    }

    @GetMapping
    public List<Marca> listar() {
        return repository.findAll();
    }

    @GetMapping("/buscar")
    public List<Marca> buscar(@RequestParam String nome) {
        return repository.findByNomeContainingIgnoreCase(nome);
    }
}