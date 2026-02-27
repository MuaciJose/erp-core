package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.service.NcmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/estoque")
public class EstoqueController {

    @Autowired
    private NcmService ncmService;

    @PostMapping("/importar-ncm")
    public ResponseEntity<String> uploadNcm(@RequestParam("file") MultipartFile file) {
        try {
            ncmService.importarNcmDoJson(file);
            return ResponseEntity.ok("Carga de NCM processada com sucesso!");
        } catch (Exception e) {
            // Log the exception e
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro no processamento do arquivo NCM.");
        }
    }
}
