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

    @PostMapping("/emitir-nfe/{vendaId}")
    public ResponseEntity<?> emitirNfe(@PathVariable Long vendaId) {
        try {
            // Chama o serviço que faz o trabalho pesado
            Map<String, Object> respostaSefaz = nfeService.emitirNfeSefaz(vendaId);
            return ResponseEntity.ok(respostaSefaz);

        } catch (Exception e) {
            String mensagemErro = e.getMessage();

            // 🚀 BLINDAGEM CONTRA VAZAMENTO DE SQL NO FRONT-END
            // Se a mensagem contiver termos técnicos de banco de dados, nós a mascaramos.
            if (mensagemErro != null && (
                    mensagemErro.toLowerCase().contains("sql") ||
                            mensagemErro.toLowerCase().contains("constraint") ||
                            mensagemErro.toLowerCase().contains("could not execute statement") ||
                            mensagemErro.toLowerCase().contains("duplicate key"))) {

                // Imprime o erro real no painel do servidor para você investigar depois
                System.err.println("[ERRO GRAVE - FISCAL] " + mensagemErro);
                e.printStackTrace();

                // Manda uma mensagem educada e segura para a tela do React
                mensagemErro = "Ocorreu uma inconsistência interna no servidor ao tentar salvar a nota. A operação foi cancelada por segurança.";
            }

            // Devolve 400 Bad Request apenas com a mensagem filtrada
            return ResponseEntity.badRequest().body(Map.of("message", mensagemErro));
        }
    }
}