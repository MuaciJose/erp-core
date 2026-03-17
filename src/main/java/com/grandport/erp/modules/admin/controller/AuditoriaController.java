package com.grandport.erp.modules.admin.controller;

// 🚀 AQUI ESTÁ A SOLUÇÃO: O import que avisa ao Java onde está o modelo!
import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.service.AuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService service;

    // 🚀 Agora suporta paginação! Ex: /api/auditoria?page=0&size=20
    @GetMapping
    public ResponseEntity<Page<LogAuditoria>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.listarTodos(PageRequest.of(page, size)));
    }

    @PostMapping("/registrar")
    public ResponseEntity<Void> registrarAcao(@RequestBody Map<String, String> payload) {
        service.registrar(
                payload.getOrDefault("modulo", "INDEFINIDO"),
                payload.getOrDefault("acao", "ACAO_DESCONHECIDA"),
                payload.getOrDefault("detalhes", "Sem detalhes adicionais")
        );
        return ResponseEntity.ok().build();
    }
}