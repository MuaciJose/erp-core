package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.service.BoletoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/financeiro/boletos")
@Tag(name = "Financeiro - Emissão de Boletos")
public class BoletoController {

    private static final Logger log = LoggerFactory.getLogger(BoletoController.class);

    @Autowired
    private BoletoService boletoService;

    @GetMapping("/{contaReceberId}/gerar-pdf/{contaBancariaId}")
    @Operation(summary = "Gera o PDF visual do Boleto Bancário para entregar ao cliente")
    public ResponseEntity<byte[]> baixarBoletoPdf(
            @PathVariable Long contaReceberId,
            @PathVariable Long contaBancariaId) {

        try {
            // Chama o motor que preparamos
            byte[] pdfBytes = boletoService.gerarBoletoPdf(contaReceberId, contaBancariaId);

            // Diz ao navegador que isto é um ficheiro PDF para ser descarregado/visualizado
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"BOLETO_" + contaReceberId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF do boleto contaReceber={} contaBancaria={}", contaReceberId, contaBancariaId, e);
            return ResponseEntity.badRequest().body(null);
        }
    }
}
