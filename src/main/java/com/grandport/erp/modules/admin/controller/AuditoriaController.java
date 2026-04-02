package com.grandport.erp.modules.admin.controller;

import com.grandport.erp.modules.admin.dto.LogAuditoriaResumoDTO;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasAnyAuthority('ROLE_AUDITORIA', 'ROLE_USUARIOS', 'ROLE_CONFIGURACOES', 'ROLE_PLATFORM_ADMIN')")
public class AuditoriaController {

    private final AuditoriaService service;

    public AuditoriaController(AuditoriaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<LogAuditoriaResumoDTO>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long empresaId,
            @RequestParam(required = false) String modulo,
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(service.listarFiltrado(
                empresaId,
                modulo,
                acao,
                busca,
                dataInicio,
                dataFim,
                PageRequest.of(page, size)
        ));
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
