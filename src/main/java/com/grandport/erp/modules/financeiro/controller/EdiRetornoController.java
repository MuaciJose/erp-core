package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.service.EdiRetornoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/financeiro/edi/retorno") // 🚀 AQUI ESTÁ A ROTA EXATA QUE O REACT PROCURA!
@Tag(name = "Financeiro - EDI Retorno")
public class EdiRetornoController {

    private static final Logger log = LoggerFactory.getLogger(EdiRetornoController.class);

    @Autowired
    private EdiRetornoService retornoService;

    @PostMapping(value = "/importar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importa o arquivo de retorno CNAB para baixa automática")
    public ResponseEntity<?> importarRetornoBancario(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Recebendo arquivo de retorno bancário {}", file.getOriginalFilename());
            String resultado = retornoService.processarArquivoRetorno(file);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao processar arquivo de retorno bancário {}", file.getOriginalFilename(), e);
            return ResponseEntity.badRequest().body("Erro ao processar Retorno: " + e.getMessage());
        }
    }
}
