package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.vendas.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize; // (Pode comentar/remover essa linha se der erro de segurança)
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin("*") // 🚀 ISSO LIBERA O REACT PARA CONVERSAR COM ESTA ROTA
@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {

    @Autowired
    private WhatsAppService whatsAppService;

    @GetMapping("/qrcode")
    public ResponseEntity<?> solicitarQrCode() {
        try {
            Map<String, Object> respostaApi = whatsAppService.solicitarQrCodeConexao();
            return ResponseEntity.ok(respostaApi);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}