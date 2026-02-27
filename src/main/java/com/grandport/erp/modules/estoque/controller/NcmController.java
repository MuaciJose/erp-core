package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.service.NcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ncm")
@Tag(name = "Fiscal - NCM") // Organiza no Swagger
public class NcmController {

    @Autowired
    private NcmService service;

    @PostMapping("/upload")
    @Operation(summary = "Faz o upload de um JSON com a lista de NCMs")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        try {
            service.importarNcmDoJson(file);
            return ResponseEntity.ok("Importação de " + file.getOriginalFilename() + " concluída!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar JSON: " + e.getMessage());
        }
    }
}