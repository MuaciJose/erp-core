package com.grandport.erp.modules.compras.controller;

import com.grandport.erp.modules.compras.dto.ConfirmacaoNotaDTO;
import com.grandport.erp.modules.compras.dto.ImportacaoResumoDTO;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.compras.service.CompraService;
import com.grandport.erp.modules.compras.service.XmlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras") // 🚀 O React chama /api/compras
public class CompraController {

    @Autowired private XmlService xmlService;
    @Autowired private CompraService compraService;

    @GetMapping("/historico")
    public ResponseEntity<List<ImportacaoResumoDTO>> listarHistorico() {
        return ResponseEntity.ok(compraService.listarHistorico());
    }

    @PostMapping("/importar-xml")
    public ResponseEntity<?> uploadNfe(@RequestParam("file") MultipartFile file) {
        try {
            NfeProcDTO nfeProc = xmlService.lerXml(file);
            return ResponseEntity.ok(compraService.processarEntradaNota(nfeProc));
        } catch (Exception e) {
            // Manda a mensagem real de erro pro React (Ex: XML Duplicado)
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // 🚀 A ROTA CORRETA: O React chama PUT /confirmar/{id} e manda os Preços de Venda
    @PutMapping("/confirmar/{id}")
    public ResponseEntity<?> confirmar(@PathVariable Long id, @RequestBody(required = false) ConfirmacaoNotaDTO dto) {
        compraService.finalizarNota(id, dto);
        return ResponseEntity.ok(Map.of("mensagem", "Nota conferida e preços de venda atualizados com sucesso no estoque!"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        compraService.excluirImportacao(id);
        return ResponseEntity.noContent().build();
    }
}