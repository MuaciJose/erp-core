package com.grandport.erp.modules.relatorios.controller;

import com.grandport.erp.modules.relatorios.dto.CurvaAbcDTO;
import com.grandport.erp.modules.relatorios.service.CurvaAbcService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final CurvaAbcService curvaAbcService;

    @GetMapping("/curva-abc")
    public ResponseEntity<List<CurvaAbcDTO>> getCurvaABC() {
        List<CurvaAbcDTO> resultado = curvaAbcService.calcularCurvaABC();
        return ResponseEntity.ok(resultado);
    }
}