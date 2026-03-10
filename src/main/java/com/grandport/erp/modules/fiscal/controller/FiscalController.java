package com.grandport.erp.modules.fiscal.controller;

import com.grandport.erp.modules.fiscal.service.NfeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
public class FiscalController {

    @Autowired
    private NfeService nfeService;

    @PostMapping("/emitir-nfe/{pedidoId}")
    public ResponseEntity<?> emitirNfe(@PathVariable Long pedidoId) {
        try {
            // Chama o serviço que faz o trabalho pesado
            Map<String, Object> respostaSefaz = nfeService.emitirNfeSefaz(pedidoId);

            // Devolve 200 OK com os dados da nota aprovada
            return ResponseEntity.ok(respostaSefaz);

        } catch (Exception e) {
            // Se der erro de validação ou a SEFAZ rejeitar, devolve 400 Bad Request
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}