package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/financeiro")
public class FinanceiroController {

    @Autowired
    private FinanceiroService service;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.service.FinanceiroService financeiroService;

    @GetMapping("/contas-a-receber")
    public ResponseEntity<List<ContaReceberDTO>> getContasAReceber() {
        return ResponseEntity.ok(service.listarContasAReceber());
    }

    //@GetMapping("/contas-a-pagar")
    //public ResponseEntity<List<ContaPagarDTO>> getContasAPagar() {
    //    return ResponseEntity.ok(service.listarContasAPagar());
    //}

    @GetMapping("/contas-bancarias")
    public ResponseEntity<List<ContaBancaria>> getContasBancarias() {
        return ResponseEntity.ok(service.listarContasBancarias());
    }

    @PostMapping("/contas-bancarias")
    public ResponseEntity<ContaBancaria> criarContaBancaria(@RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(service.criarContaBancaria(conta));
    }

    @PostMapping("/contas-bancarias/transferir")
    public ResponseEntity<Void> transferir(@RequestBody TransferenciaDTO dto) {
        service.transferirEntreContas(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contas-pagar/manual")
    public ResponseEntity<ContaPagar> registrarDespesaManual(@RequestBody DespesaManualDTO dto) {
        return ResponseEntity.ok(service.registrarDespesaManual(dto));
    }

    @PatchMapping("/contas-a-pagar/{id}/baixar")
    public ResponseEntity<Void> baixarContaPagar(@PathVariable Long id) {
        service.baixarContaPagar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/contas-a-pagar/{id}/liquidar")
    public ResponseEntity<Void> liquidarContaPagar(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        service.liquidarContaPagar(id, payload.get("contaBancariaId"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/extrato/{parceiroId}")
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(service.gerarExtratoParceiro(parceiroId));
    }

    @GetMapping("/dre")
    public ResponseEntity<DreDTO> getDre(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth mesAno) {
        return ResponseEntity.ok(service.calcularDre(mesAno));
    }

    // =======================================================
    // 🚀 ROTA DE DAR BAIXA (Receber o Pagamento)
    // =======================================================
    @PostMapping("/contas-a-receber/{id}/baixar")
    public ResponseEntity<?> baixarContaReceber(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        try {
            // CORREÇÃO AQUI: Mudado de 'financeiroService' para 'service'
            service.baixarContaReceber(id, payload);
            return ResponseEntity.ok(java.util.Map.of("message", "Conta baixada com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    // 🚀 NOVA ROTA: GERAR PDF DO DRE
    @GetMapping("/dre/pdf")
    public ResponseEntity<byte[]> imprimirDrePdf(@RequestParam String mesAno) {

        // 🚀 A MÁGICA AQUI: O java.time.YearMonth.parse() converte o Texto em Data!
        var dados = financeiroService.calcularDre(java.time.YearMonth.parse(mesAno));

        var empresa = configuracaoRepository.findById(1L)
                .orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // 2. Transforma o YYYY-MM em "Mês de Ano" para ficar bonito
        String[] partes = mesAno.split("-");
        String[] meses = {"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"};
        String mesExtenso = meses[Integer.parseInt(partes[1]) - 1] + " de " + partes[0];

        // 3. Faz a matemática para injetar no layout
        double receitaBruta = dados.getReceitaBruta() != null ? dados.getReceitaBruta().doubleValue() : 0.0;
        double devolucoes = dados.getDevolucoesDescontos() != null ? dados.getDevolucoesDescontos().doubleValue() : 0.0;
        double receitaLiquida = receitaBruta - devolucoes;
        double cmv = dados.getCmv() != null ? dados.getCmv().doubleValue() : 0.0;
        double lucroBruto = receitaLiquida - cmv;

        double totalDespesas = 0.0;
        if (dados.getDespesasOperacionais() != null) {
            for (java.math.BigDecimal valor : dados.getDespesasOperacionais().values()) {
                totalDespesas += (valor != null ? valor.doubleValue() : 0.0);
            }
        }

        double lucroLiquido = lucroBruto - totalDespesas;
        double margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("dados", dados);
        variaveis.put("mesExtenso", mesExtenso);
        variaveis.put("receitaLiquida", receitaLiquida);
        variaveis.put("lucroBruto", lucroBruto);
        variaveis.put("totalDespesas", totalDespesas);
        variaveis.put("lucroLiquido", lucroLiquido);
        variaveis.put("margemLiquida", margemLiquida);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        // 4. Puxa o layout do banco ou usa o padrão
        String htmlDoBanco = empresa.getLayoutHtmlDre();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>" +
                    "@page { margin: 1.5cm; size: A4 portrait; }" +
                    "body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; margin: 0; }" +
                    ".header { border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: table; width: 100%; }" +
                    ".header td { vertical-align: bottom; }" +
                    "h1 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }" +
                    ".subtitle { margin: 4px 0 0; font-size: 10px; color: #10b981; font-weight: bold; text-transform: uppercase; }" +
                    ".company { font-size: 14px; font-weight: 900; color: #3b82f6; text-transform: uppercase; text-align: right; }" +
                    ".dre-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }" +
                    ".dre-table th { background: #0f172a; color: white; text-align: left; padding: 10px 15px; font-size: 9px; text-transform: uppercase; }" +
                    ".dre-table td { padding: 8px 15px; border-bottom: 1px solid #e2e8f0; }" +
                    ".text-right { text-align: right; }" +
                    ".row-group { background: #f1f5f9; font-weight: bold; color: #334155; }" +
                    ".row-subtotal { background: #e2e8f0; font-weight: 900; color: #0f172a; font-size: 12px; }" +
                    ".row-item td:first-child { padding-left: 30px; color: #64748b; }" +
                    ".row-total-final { font-weight: 900; font-size: 14px; }" +
                    ".val-red { color: #ef4444; }" +
                    "</style></head><body>" +
                    "<table class=\"header\"><tr>" +
                    "<td width=\"60%\"><h1>Demonstração do Resultado</h1><div class=\"subtitle\">Período Oficial: <span th:text=\"${mesExtenso}\"></span></div></td>" +
                    "<td width=\"40%\" class=\"company\" th:text=\"${empresa.nomeFantasia}\">EMPRESA</td>" +
                    "</tr></table>" +

                    "<table class=\"dre-table\"><thead><tr><th>Descrição Contábil / Gerencial</th><th class=\"text-right\">Valor (R$)</th></tr></thead><tbody>" +
                    "<tr class=\"row-group\"><td>(+) RECEITA BRUTA DE VENDAS</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(dados.receitaBruta, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr class=\"row-item\"><td>(-) Devoluções e Descontos</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(dados.devolucoesDescontos, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr class=\"row-subtotal\"><td>(=) RECEITA LÍQUIDA</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(receitaLiquida, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +

                    "<tr><td colspan=\"2\" style=\"border:none; padding:4px;\"></td></tr>" +
                    "<tr class=\"row-group\"><td>(-) CMV (Custo da Mercadoria)</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(dados.cmv, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "<tr class=\"row-subtotal\"><td>(=) LUCRO BRUTO</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(lucroBruto, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +

                    "<tr><td colspan=\"2\" style=\"border:none; padding:4px;\"></td></tr>" +
                    "<tr class=\"row-group\"><td>(-) DESPESAS OPERACIONAIS</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(totalDespesas, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +

                    "<tr class=\"row-item\" th:each=\"despesa : ${dados.despesasOperacionais}\">" +
                    "<td th:text=\"${#strings.toUpperCase(despesa.key)}\"></td>" +
                    "<td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(despesa.value, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +

                    "<tr><td colspan=\"2\" style=\"border:none; padding:8px;\"></td></tr>" +
                    "<tr class=\"row-total-final\" th:style=\"${lucroLiquido >= 0 ? 'background:#dcfce7; color:#166534;' : 'background:#fee2e2; color:#991b1b;'}\">" +
                    "<td th:text=\"'(=) RESULTADO LÍQUIDO (Margem: ' + ${#numbers.formatDecimal(margemLiquida, 1, 'POINT', 1, 'COMMA')} + '% )'\"></td>" +
                    "<td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(lucroLiquido, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr>" +
                    "</tbody></table>" +

                    "<div style=\"text-align:center; font-size:10px; margin-top:50px; color:#64748b;\">Gerado pelo sistema em: <span th:text=\"${dataEmissao}\"></span></div>" +
                    "</body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=DRE-" + mesAno + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }


}