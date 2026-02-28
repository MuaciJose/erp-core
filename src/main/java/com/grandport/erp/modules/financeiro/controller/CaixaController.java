package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO;
import com.grandport.erp.modules.financeiro.service.CaixaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/caixa")
public class CaixaController {

    @Autowired
    private CaixaService caixaService;

    @GetMapping("/atual")
    public ResponseEntity<CaixaDiarioDTO> getCaixaAtual() {
        return ResponseEntity.ok(caixaService.getCaixaAtual());
    }

    @PostMapping("/abrir")
    public ResponseEntity<Void> abrirCaixa(@RequestBody Map<String, BigDecimal> payload) {
        caixaService.abrirCaixa(payload.get("saldoInicial"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/fechar")
    public ResponseEntity<Void> fecharCaixa(@RequestBody Map<String, BigDecimal> payload) {
        caixaService.fecharCaixa(payload.get("valorInformado"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sangria")
    public ResponseEntity<Void> registrarSangria(@RequestBody Map<String, Object> payload) {
        BigDecimal valor = new BigDecimal(payload.get("valor").toString());
        String motivo = (String) payload.get("motivo");
        caixaService.registrarSangria(valor, motivo);
        return ResponseEntity.ok().build();
    }
}
