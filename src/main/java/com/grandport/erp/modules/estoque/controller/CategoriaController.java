package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.estoque.model.Categoria;
import com.grandport.erp.modules.estoque.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository repository;
    @Autowired
    private EmpresaContextService empresaContextService;

    @GetMapping
    public List<Categoria> listar() {
        return repository.findByEmpresaIdOrderByNomeAsc(empresaContextService.getRequiredEmpresaId());
    }

    @PostMapping
    public Categoria salvar(@RequestBody Categoria categoria) {
        categoria.setEmpresaId(empresaContextService.getRequiredEmpresaId());
        return repository.save(categoria);
    }
}
