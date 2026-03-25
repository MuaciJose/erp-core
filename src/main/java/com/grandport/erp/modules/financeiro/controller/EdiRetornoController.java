package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.service.EdiRetornoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/financeiro/edi/retorno") // 🚀 AQUI ESTÁ A ROTA EXATA QUE O REACT PROCURA!
@Tag(name = "Financeiro - EDI Retorno")
public class EdiRetornoController {

    @Autowired
    private EdiRetornoService retornoService;

    @PostMapping(value = "/importar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importa o arquivo de retorno CNAB para baixa automática")
    public ResponseEntity<?> importarRetornoBancario(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println(">>> RECEBENDO ARQUIVO DE RETORNO: " + file.getOriginalFilename());
            String resultado = retornoService.processarArquivoRetorno(file);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao processar Retorno: " + e.getMessage());
        }
    }
}