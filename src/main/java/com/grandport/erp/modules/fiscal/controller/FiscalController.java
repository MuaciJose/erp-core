package com.grandport.erp.modules.fiscal.controller;

import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.repository.NotaFiscalRepository;
import com.grandport.erp.modules.fiscal.service.DanfeService;
import com.grandport.erp.modules.fiscal.service.NfeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
public class FiscalController {

    @Autowired
    private NfeService nfeService;

    @Autowired
    private DanfeService danfeService; // 🚀 Injetando o "pintor" do PDF

    @Autowired
    private NotaFiscalRepository notaFiscalRepository; // 🚀 Para buscar a nota no banco

    @PostMapping("/emitir-nfe/{vendaId}")
    public ResponseEntity<?> emitirNfe(@PathVariable Long vendaId) {
        try {
            Map<String, Object> respostaSefaz = nfeService.emitirNfeSefaz(vendaId);
            return ResponseEntity.ok(respostaSefaz);

        } catch (Exception e) {
            String mensagemErro = e.getMessage();

            // 🚀 BLINDAGEM CONTRA VAZAMENTO DE SQL NO FRONT-END
            if (mensagemErro != null && (
                    mensagemErro.toLowerCase().contains("sql") ||
                            mensagemErro.toLowerCase().contains("constraint") ||
                            mensagemErro.toLowerCase().contains("could not execute statement") ||
                            mensagemErro.toLowerCase().contains("duplicate key"))) {

                System.err.println("[ERRO GRAVE - FISCAL] " + mensagemErro);
                e.printStackTrace();
                mensagemErro = "Inconsistência interna no servidor ao tentar salvar a nota.";
            }

            return ResponseEntity.badRequest().body(Map.of("message", mensagemErro));
        }
    }

    // =======================================================================
    // 🚀 NOVO: ROTA PARA DOWNLOAD/VISUALIZAÇÃO DO DANFE (PDF)
    // =======================================================================
    @GetMapping("/{nfeId}/danfe")
    public ResponseEntity<byte[]> baixarDanfe(@PathVariable Long nfeId) {
        try {
            // 1. Busca os dados da nota salvos no banco
            NotaFiscal nota = notaFiscalRepository.findById(nfeId)
                    .orElseThrow(() -> new Exception("Nota Fiscal não encontrada."));

            // 2. Chama o JasperReports (DanfeService) para gerar os bytes do PDF
            byte[] pdfBytes = danfeService.gerarDanfePdf(nota);

            // 3. Monta a resposta para o navegador entender que é um PDF
            return ResponseEntity.ok()
                    // 'inline' abre no navegador, 'attachment' força o download
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=danfe_" + nota.getNumero() + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            System.err.println("[ERRO - GERAR PDF] " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}