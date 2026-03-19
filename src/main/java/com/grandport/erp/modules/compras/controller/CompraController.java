package com.grandport.erp.modules.compras.controller;

import com.grandport.erp.modules.compras.dto.ConfirmacaoNotaDTO;
import com.grandport.erp.modules.compras.dto.ImportacaoResumoDTO;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.compras.service.CompraService;
import com.grandport.erp.modules.compras.service.XmlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras") // 🚀 O React chama /api/compras
public class CompraController {

    @Autowired private XmlService xmlService;
    @Autowired private CompraService compraService;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private com.grandport.erp.modules.compras.repository.CompraXMLRepository compraXMLRepository;

    @Autowired
    private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

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

    // 🚀 ROTA DO PDF ALINHADA COM A CENTRAL DE LAYOUTS
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> imprimirEspelhoNota(@PathVariable Long id) {

        // Puxando o CompraXML (Que tem o getNumero e os Itens)
        var nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota Fiscal não encontrada."));

        var empresa = configuracaoRepository.findById(1L)
                .orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("nota", nota);
        variaveis.put("itens", nota.getItens()); // 🚀 Lista de Peças garantida!
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        // 🚀 AQUI É A MÁGICA: Tenta ler o layout do Banco de Dados primeiro!
        String htmlEspelho = empresa.getLayoutHtmlEspelhoNota();

        // Se estiver vazio lá na Central de Layouts, usa esse layout padrão (Estepe)
        if (htmlEspelho == null || htmlEspelho.trim().isEmpty()) {
            htmlEspelho = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>" +
                    "@page { margin: 1.5cm; size: A4; }" +
                    "body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #334155; margin: 0; }" +
                    ".header { width: 100%; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }" +
                    ".logo { max-height: 60px; max-width: 150px; }" +
                    ".titulo { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; }" +
                    ".subtitulo { font-size: 10px; color: #3b82f6; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-top: 5px; }" +
                    ".box-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; width: 100%; }" +
                    ".box-info table { width: 100%; }" +
                    ".label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; }" +
                    ".valor { font-size: 13px; font-weight: 900; color: #0f172a; }" +
                    ".tabela-itens { width: 100%; border-collapse: collapse; margin-top: 10px; }" +
                    ".tabela-itens th { background: #0f172a; color: #ffffff; font-size: 9px; text-transform: uppercase; padding: 10px; text-align: left; }" +
                    ".tabela-itens td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }" +
                    ".tabela-itens tr:nth-child(even) { background-color: #f8fafc; }" +
                    ".text-right { text-align: right !important; }" +
                    ".text-center { text-align: center !important; }" +
                    ".badge-status { background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }" +
                    "</style></head><body>" +

                    "<table class=\"header\"><tr><td width=\"70%\">" +
                    "<h1 class=\"titulo\" th:text=\"${empresa.nomeFantasia != null ? empresa.nomeFantasia : 'NOME DA EMPRESA'}\">EMPRESA</h1>" +
                    "<div class=\"subtitulo\">Espelho de Conferência - Entrada de Nota Fiscal</div>" +
                    "</td><td width=\"30%\" class=\"text-right\">" +
                    "<div th:if=\"${empresa.logoBase64 != null and !empresa.logoBase64.isEmpty()}\"><img th:src=\"${empresa.logoBase64}\" class=\"logo\"/></div>" +
                    "</td></tr></table>" +

                    "<div class=\"box-info\"><table><tr>" +
                    "<td width=\"45%\"><div class=\"label\">Fornecedor</div><div class=\"valor\" th:text=\"${nota.fornecedor}\">FORNECEDOR</div></td>" +
                    "<td width=\"20%\"><div class=\"label\">Número da NF-e</div><div class=\"valor\" th:text=\"'#' + ${nota.numero}\">000000</div></td>" +
                    "<td width=\"15%\"><div class=\"label\">Status ERP</div><div class=\"valor badge-status\" th:text=\"${nota.status}\">STATUS</div></td>" +
                    "<td width=\"20%\" class=\"text-right\"><div class=\"label\">Valor Total Importado</div><div class=\"valor\" style=\"color:#10b981;\">R$ <span th:text=\"${#numbers.formatDecimal(nota.valorTotal, 1, 'POINT', 2, 'COMMA')}\"></span></div></td>" +
                    "</tr></table></div>" +

                    "<h3 style=\"font-size: 12px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;\">Itens Importados do XML</h3>" +

                    "<table class=\"tabela-itens\"><thead><tr>" +
                    "<th width=\"10%\">Ref/SKU</th>" +
                    "<th width=\"45%\">Descrição Original da Peça</th>" +
                    "<th width=\"10%\" class=\"text-center\">UN</th>" +
                    "<th width=\"15%\" class=\"text-center\">Qtd. XML</th>" +
                    "<th width=\"20%\" class=\"text-right\">Custo Unit. XML (R$)</th>" +
                    "</tr></thead><tbody>" +

                    "<tr th:each=\"item : ${itens}\">" +
                    "<td>S/N</td>" +
                    "<td style=\"font-weight: bold;\" th:text=\"${item.nome}\"></td>" +
                    "<td class=\"text-center\" th:text=\"${item.unidadeMedida}\"></td>" +
                    "<td class=\"text-center bold\" th:text=\"${item.quantidade}\"></td>" +
                    "<td class=\"text-right bold\">R$ <span th:text=\"${item.precoCusto != null ? #numbers.formatDecimal(item.precoCusto, 1, 'POINT', 2, 'COMMA') : '0,00'}\"></span></td>" +
                    "</tr>" +

                    "</tbody></table>" +

                    "<div style=\"margin-top: 40px; text-align: center; font-size: 10px; color: #64748b;\">" +
                    "___________________________________________________<br/>" +
                    "Assinatura do Conferente<br/><br/>" +
                    "Gerado em: <span th:text=\"${dataEmissao}\"></span>" +
                    "</div>" +

                    "</body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlEspelho, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Espelho-Nota-" + nota.getNumero() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}