package com.grandport.erp.modules.compras.controller;

import com.grandport.erp.modules.compras.dto.ImportacaoResumoDTO;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.compras.service.CompraService;
import com.grandport.erp.modules.compras.service.XmlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/compras") // 🚀 O React chama /api/compras, então aqui deve ser igual!
public class CompraController {

    @Autowired private XmlService xmlService;
    @Autowired private CompraService compraService;

    @GetMapping("/historico")
    public ResponseEntity<List<ImportacaoResumoDTO>> listarHistorico() {
        return ResponseEntity.ok(compraService.listarHistorico());
    }

    @PostMapping("/importar-xml")
    public ResponseEntity<ImportacaoResumoDTO> uploadNfe(@RequestParam("file") MultipartFile file) {
        try {
            NfeProcDTO nfeProc = xmlService.lerXml(file);
            return ResponseEntity.ok(compraService.processarEntradaNota(nfeProc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 🚀 A ROTA QUE ESTAVA DANDO 403
    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<Void> finalizar(@PathVariable Long id) {
        compraService.finalizarNota(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        compraService.excluirImportacao(id);
        return ResponseEntity.noContent().build();
    }
}