package com.grandport.erp.modules.checklist.controller;

import com.grandport.erp.modules.arquivos.service.FotoStorageService;
import com.grandport.erp.modules.checklist.dto.ChecklistRequestDTO;
import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.checklist.repository.ChecklistRepository;
import com.grandport.erp.modules.checklist.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private ChecklistRepository checklistRepository;

    @Autowired
    private FotoStorageService fotoStorageService;

    @PostMapping
    public ResponseEntity<ChecklistVeiculo> criar(@RequestBody ChecklistRequestDTO dto) {
        return ResponseEntity.ok(checklistService.criar(dto));
    }

    @GetMapping("/veiculo/{veiculoId}")
    public ResponseEntity<List<ChecklistVeiculo>> listarPorVeiculo(@PathVariable Long veiculoId) {
        return ResponseEntity.ok(checklistService.listarPorVeiculo(veiculoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChecklistVeiculo> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(checklistService.buscarPorId(id));
    }
}