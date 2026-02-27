package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.vendas.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendas/relatorios")
public class RelatorioVendaController {

    @Autowired
    private RelatorioService relatorioService;

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> imprimirVenda(@PathVariable Long id) {
        byte[] pdf = relatorioService.gerarPdfVenda(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("inline", "venda_" + id + ".pdf");

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}