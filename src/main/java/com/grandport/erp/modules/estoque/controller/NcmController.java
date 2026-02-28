package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.service.NcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ncm")
@Tag(name = "Fiscal - NCM")
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

    @GetMapping("/busca")
    @Operation(summary = "Busca NCM por código ou descrição")
    public ResponseEntity<List<Ncm>> buscar(@RequestParam("q") String termo) {
        return ResponseEntity.ok(service.buscarNcm(termo));
    }
}
