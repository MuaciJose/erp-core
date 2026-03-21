package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.vendas.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/whatsapp") // A ROTA BASE CORRETA
public class WhatsAppController {

    @Autowired
    private WhatsAppService whatsAppService;

    // Rota que o React chama para pegar o QR Code
    @GetMapping("/qrcode")
    public ResponseEntity<?> solicitarQrCode() {
        try {
            Map<String, Object> respostaApi = whatsAppService.solicitarQrCodeConexao();
            return ResponseEntity.ok(respostaApi);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    // 🚀 ROTA NOVA: Que o React chama para o botão "Testar Conexão"
    @GetMapping("/status")
    public ResponseEntity<?> verificarStatus() {
        try {
            Map<String, Object> respostaApi = whatsAppService.consultarStatusInstancia();
            return ResponseEntity.ok(respostaApi);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            whatsAppService.desconectarInstancia();
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}