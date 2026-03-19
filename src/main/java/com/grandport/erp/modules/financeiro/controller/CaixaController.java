package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO;
import com.grandport.erp.modules.financeiro.service.CaixaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/caixa")
public class CaixaController {

    @Autowired
    private CaixaService caixaService;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.CaixaDiarioRepository caixaRepository; // 🚀 INJETE O REPOSITORY AQUI


    @GetMapping("/atual")
    public ResponseEntity<CaixaDiarioDTO> getCaixaAtual() {
        return ResponseEntity.ok(caixaService.getCaixaAtual());
    }

    @PostMapping("/abrir")
    public ResponseEntity<Void> abrirCaixa(@RequestBody Map<String, BigDecimal> payload) {
        caixaService.abrirCaixa(payload.get("saldoInicial"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/fechar")
    public ResponseEntity<Void> fecharCaixa(@RequestBody Map<String, BigDecimal> payload) {
        caixaService.fecharCaixa(payload.get("valorInformado"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sangria")
    public ResponseEntity<Void> registrarSangria(@RequestBody Map<String, Object> payload) {
        BigDecimal valor = new BigDecimal(payload.get("valor").toString());
        String motivo = (String) payload.get("motivo");
        caixaService.registrarSangria(valor, motivo);
        return ResponseEntity.ok().build();
    }

    // 🚀 ROTA BLINDADA: IMPRIME O CAIXA ATUAL OU O ÚLTIMO QUE FOI FECHADO
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> imprimirRelatorioCaixaPdf() {

        // 🚀 O SEGREDO: Pega o último registro da tabela, não importa se tá aberto ou fechado!
        var ultimoCaixa = caixaRepository.findTopByOrderByIdDesc().orElse(null);
        if (ultimoCaixa == null) return ResponseEntity.badRequest().build();

        // Converte para o seu DTO
        var caixa = new com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO(ultimoCaixa);

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("caixa", caixa);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        double totalFaturamento = (caixa.getDinheiro() != null ? caixa.getDinheiro().doubleValue() : 0) +
                (caixa.getCartao() != null ? caixa.getCartao().doubleValue() : 0) +
                (caixa.getPix() != null ? caixa.getPix().doubleValue() : 0);

        double saldoEsperado = (caixa.getSaldoInicial() != null ? caixa.getSaldoInicial().doubleValue() : 0) +
                (caixa.getDinheiro() != null ? caixa.getDinheiro().doubleValue() : 0) -
                (caixa.getSangrias() != null ? caixa.getSangrias().doubleValue() : 0);

        double valorInformado = (caixa.getValorInformadoFechamento() != null ? caixa.getValorInformadoFechamento().doubleValue() : 0);
        double diferenca = valorInformado - saldoEsperado;

        variaveis.put("totalFaturamento", totalFaturamento);
        variaveis.put("saldoEsperado", saldoEsperado);
        variaveis.put("valorInformado", valorInformado); // 🚀 Injeta no PDF
        variaveis.put("diferenca", diferenca);
        String htmlDoBanco = empresa.getLayoutHtmlFechamentoCaixa();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>body{font-family:'Courier New',Courier,monospace;font-size:12px;margin:0;padding:10px;width:280px;color:#000}.text-center{text-align:center}.text-right{text-align:right}.text-left{text-align:left}.bold{font-weight:bold}.linha{border-bottom:1px dashed #000;margin:10px 0}.titulo{font-size:16px;font-weight:bold;text-transform:uppercase}table{width:100%;border-collapse:collapse}td{padding:2px 0}</style></head><body>" +
                    "<div class=\"text-center\"><div th:if=\"${empresa.logoBase64 != null}\"><img th:src=\"${empresa.logoBase64}\" style=\"max-height:50px;margin-bottom:5px;\"/></div>" +
                    "<div class=\"titulo\" th:text=\"${empresa.nomeFantasia}\">EMPRESA</div><div th:text=\"'CNPJ: ' + ${empresa.cnpj}\"></div><div th:text=\"${empresa.telefone}\"></div>" +
                    "<div class=\"linha\"></div><div class=\"bold\" style=\"font-size:14px;\">RELATÓRIO DE CAIXA</div><div th:text=\"'Emitido em: ' + ${dataEmissao}\"></div><div th:text=\"'Status: ' + ${caixa.status}\"></div><div class=\"linha\"></div></div>" +
                    "<div><div class=\"bold text-center\" style=\"margin-bottom:5px;\">FATURAMENTO (ENTRADAS)</div><table>" +
                    "<tr><td>Dinheiro</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.dinheiro, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td>Cartão</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.cartao, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td>PIX</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.pix, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td class=\"bold\">TOTAL RECEBIDO</td><td class=\"text-right bold\">R$ <span th:text=\"${#numbers.formatDecimal(totalFaturamento, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr></table></div>" +
                    "<div class=\"linha\"></div><div><div class=\"bold text-center\" style=\"margin-bottom:5px;\">GAVETA (ESPÉCIE)</div><table>" +
                    "<tr><td>Troco Inicial</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.saldoInicial, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td>(+) Dinheiro</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.dinheiro, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td>(-) Sangrias/Ret.</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(caixa.sangrias, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr><td class=\"bold\" style=\"font-size:14px;\">SALDO ESPERADO</td><td class=\"text-right bold\" style=\"font-size:14px;\">R$ <span th:text=\"${#numbers.formatDecimal(saldoEsperado, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr></table></div>" +
                    "<div class=\"linha\"></div><div class=\"text-center\" style=\"margin-top:30px;\">__________________________________<br/>Assinatura do Operador</div>" +
                    "</body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Caixa.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}
