package com.grandport.erp.modules.admin.controller;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService service;

    @GetMapping
    public ResponseEntity<List<LogAuditoria>> getLogs() {
        return ResponseEntity.ok(service.listarTodos());
    }
}
