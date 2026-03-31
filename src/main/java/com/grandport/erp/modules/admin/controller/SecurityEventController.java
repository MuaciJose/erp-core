package com.grandport.erp.modules.admin.controller;

import com.grandport.erp.modules.admin.model.SecurityEvent;
import com.grandport.erp.modules.admin.service.SecurityEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/security-events")
@RequiredArgsConstructor
public class SecurityEventController {

    private final SecurityEventService securityEventService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'AUDITORIA')")
    public List<SecurityEvent> listar(@RequestParam(defaultValue = "20") int limit) {
        return securityEventService.listarRecentes(limit);
    }
}
