package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.ConciliacaoDTO;
import com.grandport.erp.modules.financeiro.service.ConciliacaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/financeiro/conciliacao")
public class ConciliacaoController {

    private static final Logger log = LoggerFactory.getLogger(ConciliacaoController.class);

    @Autowired
    private ConciliacaoService service;

    @PostMapping("/importar-ofx")
    public ResponseEntity<ConciliacaoDTO> importarOfx(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(service.processarOfx(file));
        } catch (Exception e) {
            log.error("Erro ao processar arquivo OFX {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Erro ao processar arquivo OFX: " + e.getMessage(), e);
        }
    }
}
