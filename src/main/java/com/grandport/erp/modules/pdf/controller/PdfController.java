package com.grandport.erp.modules.pdf.controller;

import com.grandport.erp.modules.pdf.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/teste-pdf")
public class PdfController {

    @Autowired
    private PdfService pdfService;

    @GetMapping
    public ResponseEntity<byte[]> testarImpressao() {
        // Inventando dados fakes para o nosso teste
        Map<String, Object> dados = new HashMap<>();
        dados.put("clienteNome", "Ayrton Senna da Silva");
        dados.put("valorTotal", "R$ 5.430,00");

        // Chama o motor passando o nome do HTML (sem o .html no final) e os dados
        byte[] arquivoPdf = pdfService.gerarPdfDeHtml("recibo-teste", dados);

        // Devolve o PDF para o navegador exibir
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=recibo-os.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}