package com.grandport.erp.modules.admin.controller;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService service;

    @GetMapping
    public ResponseEntity<List<LogAuditoria>> getLogs() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @PostMapping("/registrar")
    public ResponseEntity<Void> registrarAcao(@RequestBody Map<String, String> payload) {
        service.registrar(
            payload.get("modulo"), 
            payload.get("acao"), 
            payload.get("detalhes")
        );
        return ResponseEntity.ok().build();
    }
}
