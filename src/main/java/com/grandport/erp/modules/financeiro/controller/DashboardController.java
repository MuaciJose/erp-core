package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.financeiro.dto.InsightDTO;
import com.grandport.erp.modules.financeiro.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService service;

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoDTO> getResumo() {
        return ResponseEntity.ok(service.getResumoDashboard());
    }

    @GetMapping("/insights")
    public ResponseEntity<List<InsightDTO>> getInsights() {
        return ResponseEntity.ok(service.getInsightsInteligentes());
    }
}
