package com.grandport.erp.modules.compras.controller;

import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.compras.service.CompraService;
import com.grandport.erp.modules.compras.service.XmlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/compras/nfe")
public class CompraController {

    @Autowired private XmlService xmlService;
    @Autowired private CompraService compraService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadNfe(@RequestParam("file") MultipartFile file) {
        try {
            NfeProcDTO nfeProc = xmlService.lerXml(file);
            compraService.processarEntradaNota(nfeProc);
            return ResponseEntity.ok("Nota Fiscal processada com sucesso!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao processar NF-e: " + e.getMessage());
        }
    }
}
