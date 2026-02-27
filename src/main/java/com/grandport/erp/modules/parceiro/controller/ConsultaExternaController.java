package com.grandport.erp.modules.parceiro.controller;

import com.grandport.erp.modules.parceiro.dto.CepDTO;
import com.grandport.erp.modules.parceiro.dto.CnpjDTO;
import com.grandport.erp.modules.parceiro.service.ConsultaExternaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/consultas")
@Tag(name = "Utilitários - Consultas Externas")
public class ConsultaExternaController {

    @Autowired
    private ConsultaExternaService service;

    @GetMapping("/cep/{cep}")
    public ResponseEntity<CepDTO> consultarCep(@PathVariable String cep) {
        return ResponseEntity.ok(service.buscarCep(cep));
    }

    @GetMapping("/cnpj/{cnpj}")
    public ResponseEntity<CnpjDTO> consultarCnpj(@PathVariable String cnpj) {
        return ResponseEntity.ok(service.buscarCnpj(cnpj));
    }
}
