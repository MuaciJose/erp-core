package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
import com.grandport.erp.modules.financeiro.service.RelatorioComissaoService;
import com.grandport.erp.modules.pdf.service.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioComissaoController {

    @Autowired
    private RelatorioComissaoService relatorioService;

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ConfiguracaoRepository configuracaoRepository;

    // 1. Rota antiga que devolve os dados pro React desenhar na tela
    @GetMapping("/comissoes")
    public ResponseEntity<?> gerarRelatorioComissao(
            @RequestParam String inicio,
            @RequestParam String fim,
            @RequestParam(required = false) Long vendedorId) {

        LocalDateTime dataIni = LocalDate.parse(inicio).atStartOfDay();
        LocalDateTime dataFim = LocalDate.parse(fim).atTime(23, 59, 59);
        return ResponseEntity.ok(relatorioService.calcularComissoes(dataIni, dataFim, vendedorId));
    }

    // 2. 🚀 NOVA ROTA DO MOTOR V8 (THYMELEAF + PDF)
    @GetMapping("/comissoes/pdf")
    public ResponseEntity<byte[]> imprimirRelatorioPdf(
            @RequestParam String inicio,
            @RequestParam String fim,
            @RequestParam(required = false) Long vendedorId) {

        // Calcula os dados no servidor
        LocalDateTime dataIni = LocalDate.parse(inicio).atStartOfDay();
        LocalDateTime dataFim = LocalDate.parse(fim).atTime(23, 59, 59);
        List<RelatorioComissaoService.ComissaoMembroDTO> dados = relatorioService.calcularComissoes(dataIni, dataFim, vendedorId);

        // Puxa a empresa
        ConfiguracaoSistema empresa = configuracaoRepository.findById(1L).orElse(new ConfiguracaoSistema());

        // Monta a maleta do Thymeleaf
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("dados", dados);

        // Formata as datas pra ficar bonito no PDF (Ex: 01/03/2026)
        DateTimeFormatter brFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        variaveis.put("dataInicio", dataIni.format(brFormat));
        variaveis.put("dataFim", dataFim.format(brFormat));
        variaveis.put("dataEmissao", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        // Pega o Layout do Banco ou usa o Padrão de Luxo
        String htmlDoBanco = empresa.getLayoutHtmlRelatorioComissao();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#333}.header{text-align:center;border-bottom:3px solid #1e293b;padding-bottom:15px;margin-bottom:20px}.header h1{margin:0;font-size:24px;text-transform:uppercase}.info-box{background:#f1f5f9;padding:10px;border-radius:5px;margin-bottom:20px;font-weight:bold;text-align:center}.membro-box{border:2px solid #cbd5e1;border-radius:8px;margin-bottom:30px;padding:15px}.membro-header{display:flex;justify-content:space-between;border-bottom:1px solid #cbd5e1;padding-bottom:10px;margin-bottom:10px}.membro-header h2{margin:0;color:#0f172a;text-transform:uppercase}.totais{font-size:16px;font-weight:900;color:#16a34a}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px}th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}th{background:#f8fafc;text-transform:uppercase}.text-right{text-align:right}.text-center{text-align:center}</style></head><body>" +
                    "<div class=\"header\"><div th:if=\"${empresa.logoBase64 != null and !empresa.logoBase64.isEmpty()}\"><img th:src=\"${empresa.logoBase64}\" style=\"max-height:60px;\"/></div><h1 th:text=\"${empresa.nomeFantasia}\">EMPRESA</h1><p>DEMONSTRATIVO DE COMISSÕES (FECHAMENTO DE FOLHA)</p></div>" +
                    "<div class=\"info-box\">Período de Apuração: <span th:text=\"${dataInicio}\"></span> a <span th:text=\"${dataFim}\"></span><br/><span style=\"font-size:10px;color:#64748b;\">Gerado em: <span th:text=\"${dataEmissao}\"></span></span></div>" +
                    "<div th:if=\"${dados.isEmpty()}\" style=\"text-align:center;padding:50px;\">Nenhuma comissão registrada neste período.</div>" +
                    "<div th:each=\"membro : ${dados}\" class=\"membro-box\">" +
                    "<div class=\"membro-header\"><h2>COLABORADOR: <span th:text=\"${membro.nome}\"></span></h2><div class=\"totais\">A PAGAR: R$ <span th:text=\"${#numbers.formatDecimal(membro.totalComissao, 1, 'POINT', 2, 'COMMA')}\"></span></div></div>" +
                    "<p style=\"margin:0 0 10px 0;font-size:10px;\">Base de Cálculo Total: R$ <span th:text=\"${#numbers.formatDecimal(membro.totalBase, 1, 'POINT', 2, 'COMMA')}\"></span></p>" +
                    "<table><thead><tr><th width=\"15%\">Origem</th><th width=\"15%\">Tipo</th><th width=\"35%\">Descrição</th><th width=\"15%\">Regra</th><th width=\"10%\" class=\"text-right\">Base R$</th><th width=\"10%\" class=\"text-right\">Comissão</th></tr></thead>" +
                    "<tbody><tr th:each=\"det : ${membro.detalhes}\"><td th:text=\"${det.origem}\"></td><td th:text=\"${det.tipoItem}\"></td><td th:text=\"${det.descricao}\"></td><td style=\"font-size:9px;\" th:text=\"${#numbers.formatDecimal(det.percAplicado, 1, 'POINT', 1, 'COMMA')} + '% (' + ${det.tipoRegra} + ')'\"></td><td class=\"text-right\" th:text=\"${#numbers.formatDecimal(det.valorBase, 1, 'POINT', 2, 'COMMA')}\"></td><td class=\"text-right\" style=\"font-weight:bold;color:#16a34a;\" th:text=\"${#numbers.formatDecimal(det.valorComissao, 1, 'POINT', 2, 'COMMA')}\"></td></tr></tbody></table>" +
                    "<div style=\"text-align:center;margin-top:40px;border-top:1px solid #000;width:250px;padding-top:5px;font-size:10px;margin-left:auto;margin-right:auto;\">Assinatura de Recebimento</div></div>" +
                    "</body></html>";
        }

        // Gera e devolve o PDF!
        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Fechamento-Comissoes.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }


}