package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.model.Recibo;
import com.grandport.erp.modules.financeiro.repository.ReciboRepository;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import com.grandport.erp.modules.pdf.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/financeiro/recibos")
public class ReciboController {

    @Autowired
    private ReciboRepository repository;

    @Autowired
    private ConfiguracaoRepository configuracaoRepository;

    @Autowired
    private PdfService pdfService;

    // 🚀 SALVAR NOVO RECIBO NO BANCO
    @PostMapping
    public ResponseEntity<Recibo> salvar(@RequestBody Recibo recibo) {
        Recibo salvo = repository.save(recibo);
        return ResponseEntity.ok(salvo);
    }

    // 🚀 LISTAR HISTÓRICO
    @GetMapping
    public List<Recibo> listarTodos() {
        return repository.findAllByOrderByDataRegistroDesc();
    }

    // 🚀 DELETAR RECIBO DO HISTÓRICO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // 🚀 NOVA ROTA: GERADOR DE PDF DE RECIBO SOB DEMANDA (A4 PAISAGEM)
    @PostMapping("/gerar-pdf")
    public ResponseEntity<byte[]> gerarPdfReciboAvulso(@RequestBody Map<String, Object> dados) {

        // 1. Pega as configurações da empresa (Logo, Endereço, etc)
        var empresa = configuracaoRepository.findById(1L)
                .orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // 2. Formata a data por extenso (Ex: 19 de Março de 2026)
        String dataFormatada = "";
        try {
            java.time.LocalDate dataRecibo = java.time.LocalDate.parse(dados.get("data").toString());
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new java.util.Locale("pt", "BR"));
            dataFormatada = dataRecibo.format(formatter);
        } catch (Exception e) {
            dataFormatada = dados.get("data").toString();
        }

        // 3. Monta o mapa de variáveis para o Thymeleaf
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("dados", dados);
        variaveis.put("dataFormatada", dataFormatada);

        // 4. Busca o layout da Central de Configurações
        String htmlDoBanco = empresa.getLayoutHtmlRecibo();

        // 5. Layout de Estepe (Padrão caso o banco esteja vazio)
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>" +
                    "@page { margin: 1cm; size: A4 landscape; }" +
                    "body { font-family: 'Times New Roman', serif; color: #0f172a; margin: 0; }" +
                    ".recibo-container { border: 4px double #0f172a; padding: 40px; position: relative; min-height: 140mm; }" +
                    ".header { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; display: table; }" +
                    ".empresa-nome { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; font-family: sans-serif; }" +
                    ".empresa-detalhes { font-size: 10px; color: #475569; margin: 2px 0 0 0; text-transform: uppercase; font-weight: bold; font-family: sans-serif; }" +
                    ".titulo-recibo { font-size: 40px; font-style: italic; font-weight: 900; margin: 0; text-align: right; }" +
                    ".valor-box { display: inline-block; border: 2px solid #0f172a; background: #f8fafc; padding: 10px 20px; font-size: 28px; font-weight: 900; margin-top: 10px; float: right; font-family: sans-serif; }" +
                    ".texto-principal { font-size: 22px; line-height: 2.2; text-align: justify; margin-top: 30px; color: #0f172a; }" +
                    ".linha { border-bottom: 1px solid #64748b; font-weight: 900; text-transform: uppercase; }" +
                    ".data-cidade { margin-top: 40px; text-align: right; font-size: 18px; font-weight: bold; text-transform: uppercase; }" +
                    ".assinatura { margin-top: 60px; text-align: center; font-family: sans-serif; }" +
                    ".assinatura-linha { border-top: 2px solid #0f172a; width: 50%; margin: 0 auto; padding-top: 10px; }" +
                    "</style></head><body>" +
                    "<div class=\"recibo-container\">" +
                    "<table class=\"header\"><tr><td width=\"65%\">" +
                    "<div th:if=\"${dados.dadosCompletos}\">" +
                    "<h2 class=\"empresa-nome\" th:text=\"${empresa.nomeFantasia}\"></h2>" +
                    "<p class=\"empresa-detalhes\" th:text=\"'CNPJ: ' + ${empresa.cnpj}\"></p>" +
                    "<p class=\"empresa-detalhes\" th:text=\"${empresa.logradouro + ', ' + empresa.numero + ' - ' + empresa.cidade}\"></p>" +
                    "</div>" +
                    "<h2 th:if=\"${!dados.dadosCompletos}\" class=\"empresa-nome\">RECIBO</h2>" +
                    "</td><td width=\"35%\" style=\"text-align: right;\">" +
                    "<h1 class=\"titulo-recibo\">Recibo</h1>" +
                    "<div class=\"valor-box\">R$ <span th:text=\"${#numbers.formatDecimal(dados.valor, 1, 'POINT', 2, 'COMMA')}\"></span></div>" +
                    "</td></tr></table>" +
                    "<div class=\"texto-principal\">" +
                    "Recebi(emos) de <span class=\"linha\" th:text=\"${dados.pagador}\"></span>, " +
                    "a quantia de <span class=\"linha\">R$ <span th:text=\"${#numbers.formatDecimal(dados.valor, 1, 'POINT', 2, 'COMMA')}\"></span></span> " +
                    "(<span class=\"linha\" style=\"font-style: italic;\" th:text=\"${dados.valorExtenso}\"></span>), " +
                    "referente a <span class=\"linha\" th:text=\"${dados.referente}\"></span>, " +
                    "<span th:text=\"${dados.textoFinal}\"></span>" +
                    "</div>" +
                    "<div class=\"data-cidade\"><span th:text=\"${dados.cidade}\"></span>, <span th:text=\"${dataFormatada}\"></span>.</div>" +
                    "<div class=\"assinatura\"><div class=\"assinatura-linha\">" +
                    "<div style=\"font-size:18px; font-weight:900;\" th:text=\"${empresa.nomeFantasia}\"></div>" +
                    "<div style=\"font-size:12px; color:#64748b; font-weight:bold;\">Assinatura do Emitente</div>" +
                    "</div></div></div></body></html>";
        }

        // 6. Gera o PDF chamando o PdfService
        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        // 7. Retorna o arquivo para o React
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}