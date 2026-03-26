package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/financeiro")
public class FinanceiroController {

    // =======================================================
    // ⚙️ INJEÇÕES DE DEPENDÊNCIA (Todos os Motores)
    // =======================================================
    @Autowired
    private FinanceiroService financeiroService;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.ContaReceberRepository contaReceberRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.ContaPagarRepository contaPagarRepository;

    @Autowired
    private com.grandport.erp.modules.vendas.service.WhatsAppService whatsappService;


    // =======================================================
    // 🏦 MÓDULO BANCÁRIO, EXTRATOS E DRE (Seus Métodos Originais)
    // =======================================================

    @GetMapping("/contas-bancarias")
    public ResponseEntity<List<ContaBancaria>> getContasBancarias() {
        return ResponseEntity.ok(financeiroService.listarContasBancarias());
    }

    @PostMapping("/contas-bancarias")
    public ResponseEntity<ContaBancaria> criarContaBancaria(@RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(financeiroService.criarContaBancaria(conta));
    }

    @PutMapping("/contas-bancarias/{id}")
    public ResponseEntity<ContaBancaria> atualizarContaBancaria(
            @PathVariable Long id,
            @RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(financeiroService.atualizarContaBancaria(id, conta));
    }

    @DeleteMapping("/contas-bancarias/{id}")
    public ResponseEntity<Void> excluirContaBancaria(@PathVariable Long id) {
        financeiroService.excluirContaBancaria(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contas-bancarias/transferir")
    public ResponseEntity<Void> transferir(@RequestBody TransferenciaDTO dto) {
        financeiroService.transferirEntreContas(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/extrato/{parceiroId}")
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(financeiroService.gerarExtratoParceiro(parceiroId));
    }

    @GetMapping("/dre")
    public ResponseEntity<DreDTO> getDre(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth mesAno) {
        return ResponseEntity.ok(financeiroService.calcularDre(mesAno));
    }

    @GetMapping("/dre/pdf")
    public ResponseEntity<byte[]> imprimirDrePdf(@RequestParam String mesAno) {
        var dados = financeiroService.calcularDre(java.time.YearMonth.parse(mesAno));
        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        String[] partes = mesAno.split("-");
        String[] meses = {"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"};
        String mesExtenso = meses[Integer.parseInt(partes[1]) - 1] + " de " + partes[0];

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

        String htmlDoBanco = empresa.getLayoutHtmlDre();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/><style>@page { margin: 1.5cm; size: A4 portrait; } body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; margin: 0; } .header { border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: table; width: 100%; } .header td { vertical-align: bottom; } h1 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; } .subtitle { margin: 4px 0 0; font-size: 10px; color: #10b981; font-weight: bold; text-transform: uppercase; } .company { font-size: 14px; font-weight: 900; color: #3b82f6; text-transform: uppercase; text-align: right; } .dre-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; } .dre-table th { background: #0f172a; color: white; text-align: left; padding: 10px 15px; font-size: 9px; text-transform: uppercase; } .dre-table td { padding: 8px 15px; border-bottom: 1px solid #e2e8f0; } .text-right { text-align: right; } .row-group { background: #f1f5f9; font-weight: bold; color: #334155; } .row-subtotal { background: #e2e8f0; font-weight: 900; color: #0f172a; font-size: 12px; } .row-item td:first-child { padding-left: 30px; color: #64748b; } .row-total-final { font-weight: 900; font-size: 14px; } .val-red { color: #ef4444; }</style></head><body><table class=\"header\"><tr><td width=\"60%\"><h1>Demonstração do Resultado</h1><div class=\"subtitle\">Período Oficial: <span th:text=\"${mesExtenso}\"></span></div></td><td width=\"40%\" class=\"company\" th:text=\"${empresa.nomeFantasia}\">EMPRESA</td></tr></table><table class=\"dre-table\"><thead><tr><th>Descrição Contábil / Gerencial</th><th class=\"text-right\">Valor (R$)</th></tr></thead><tbody><tr class=\"row-group\"><td>(+) RECEITA BRUTA DE VENDAS</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(dados.receitaBruta, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr class=\"row-item\"><td>(-) Devoluções e Descontos</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(dados.devolucoesDescontos, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr class=\"row-subtotal\"><td>(=) RECEITA LÍQUIDA</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(receitaLiquida, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr><td colspan=\"2\" style=\"border:none; padding:4px;\"></td></tr><tr class=\"row-group\"><td>(-) CMV (Custo da Mercadoria)</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(dados.cmv, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr class=\"row-subtotal\"><td>(=) LUCRO BRUTO</td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(lucroBruto, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr><td colspan=\"2\" style=\"border:none; padding:4px;\"></td></tr><tr class=\"row-group\"><td>(-) DESPESAS OPERACIONAIS</td><td class=\"text-right val-red\">R$ <span th:text=\"${#numbers.formatDecimal(totalDespesas, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr class=\"row-item\" th:each=\"despesa : ${dados.despesasOperacionais}\"><td th:text=\"${#strings.toUpperCase(despesa.key)}\"></td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(despesa.value, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr><tr><td colspan=\"2\" style=\"border:none; padding:8px;\"></td></tr><tr class=\"row-total-final\" th:style=\"${lucroLiquido >= 0 ? 'background:#dcfce7; color:#166534;' : 'background:#fee2e2; color:#991b1b;'}\"><td th:text=\"'(=) RESULTADO LÍQUIDO (Margem: ' + ${#numbers.formatDecimal(margemLiquida, 1, 'POINT', 1, 'COMMA')} + '% )'\"></td><td class=\"text-right\">R$ <span th:text=\"${#numbers.formatDecimal(lucroLiquido, 1, 'POINT', 2, 'COMMA')}\"></span></td></tr></tbody></table><div style=\"text-align:center; font-size:10px; margin-top:50px; color:#64748b;\">Gerado pelo sistema em: <span th:text=\"${dataEmissao}\"></span></div></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=DRE-" + mesAno + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }


    // =======================================================================
    // 🔴 MÓDULO: CONTAS A PAGAR
    // =======================================================================

    @GetMapping("/contas-a-pagar")
    public ResponseEntity<List<Map<String, Object>>> listarTodasAsContasPagar() {
        List<ContaPagar> contas = contaPagarRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "dataVencimento")
        );

        List<Map<String, Object>> listaMastigada = contas.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("fornecedorNome", (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome() : "Diversos");
            map.put("descricao", c.getDescricao() != null ? c.getDescricao() : "");
            map.put("valor", c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0);
            map.put("dataVencimento", c.getDataVencimento() != null ? c.getDataVencimento() : null);
            map.put("dataPagamento", c.getDataPagamento() != null ? c.getDataPagamento() : null);

            String status = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            map.put("status", status);

            boolean atrasado = false;
            if (c.getDataVencimento() != null && !status.contains("PAG") && !status.contains("LIQUID")) {
                atrasado = c.getDataVencimento().isBefore(LocalDateTime.now());
            }
            map.put("atrasado", atrasado);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(listaMastigada);
    }

    @PostMapping("/contas-pagar/manual")
    public ResponseEntity<ContaPagar> registrarDespesaManual(@RequestBody DespesaManualDTO dto) {
        return ResponseEntity.ok(financeiroService.registrarDespesaManual(dto));
    }

    @PatchMapping("/contas-a-pagar/{id}/baixar")
    public ResponseEntity<Void> baixarContaPagar(@PathVariable Long id) {
        financeiroService.baixarContaPagar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/contas-a-pagar/{id}/liquidar")
    public ResponseEntity<Void> liquidarContaPagar(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        financeiroService.liquidarContaPagar(id, payload.get("contaBancariaId"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contas-a-pagar/{id}/recibo-pdf")
    public ResponseEntity<byte[]> imprimirReciboPagamento(@PathVariable Long id) {
        var conta = contaPagarRepository.findById(id).orElseThrow(() -> new RuntimeException("Conta não encontrada."));
        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        String nomeFornecedor = (conta.getParceiro() != null && conta.getParceiro().getNome() != null) ? conta.getParceiro().getNome() : "Diversos";
        double valorConta = conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("conta", conta);
        variaveis.put("fornecedorNome", nomeFornecedor);
        variaveis.put("valorConta", valorConta);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String htmlDoBanco = empresa.getLayoutHtmlReciboPagamento();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><style>body{font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px;}</style></head><body><h2 style='text-align:center;'>RECIBO DE PAGAMENTO</h2><hr/><b>Fornecedor:</b> <span th:text=\"${fornecedorNome}\"></span><br/><b>Descricao:</b> <span th:text=\"${conta.descricao}\"></span><br/><b>Valor Pago:</b> R$ <span th:text=\"${#numbers.formatDecimal(valorConta, 1, 'POINT', 2, 'COMMA')}\"></span><br/><hr/><p style='text-align:center; font-size:10px;'>Emitido em: <span th:text=\"${dataEmissao}\"></span></p></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo_" + conta.getId() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }

    @GetMapping("/contas-a-pagar/relatorio-pdf")
    public ResponseEntity<byte[]> imprimirRelatorioPagarGeral(
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        byte[] pdf = gerarPdfRelatorioPagarBase(busca, dataInicio, dataFim, status, tipoDataFiltro);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Relatorio_Contas_Pagar.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/contas-a-pagar/relatorio/whatsapp")
    public ResponseEntity<?> enviarRelatorioPagarWhatsApp(
            @RequestParam String telefone,
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        byte[] pdf = gerarPdfRelatorioPagarBase(busca, dataInicio, dataFim, status, tipoDataFiltro);

        try {
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Relatorio_Contas_Pagar.pdf", "Olá! Segue em anexo o Relatório de Contas a Pagar.");
            return ResponseEntity.ok(Map.of("mensagem", "Relatório enviado para o WhatsApp com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao disparar WhatsApp: " + e.getMessage()));
        }
    }


    // =======================================================================
    // 🟢 MÓDULO: CONTAS A RECEBER
    // =======================================================================

    @GetMapping("/contas-a-receber")
    public ResponseEntity<List<ContaReceberDTO>> listarTodasAsContasReceber() {
        // Usamos o seu DTO novo que já calcula o 'atrasado' e a 'dataPagamento'
        List<ContaReceber> contas = contaReceberRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "dataVencimento")
        );
        List<ContaReceberDTO> dtos = contas.stream().map(ContaReceberDTO::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/contas-a-receber/{id}/baixar")
    public ResponseEntity<?> baixarContaReceber(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            // Continua usando a sua lógica de serviço original que o módulo de promissórias também usa
            financeiroService.baixarContaReceber(id, payload);
            return ResponseEntity.ok(Map.of("message", "Conta baixada com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/contas-a-receber/{id}/recibo-pdf")
    public ResponseEntity<byte[]> imprimirReciboRecebimento(@PathVariable Long id) {
        var conta = contaReceberRepository.findById(id).orElseThrow(() -> new RuntimeException("Conta não encontrada."));
        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        String nomeCliente = (conta.getParceiro() != null && conta.getParceiro().getNome() != null) ? conta.getParceiro().getNome() : "Consumidor Final";
        double valorConta = conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("conta", conta);
        variaveis.put("clienteNome", nomeCliente);
        variaveis.put("valorConta", valorConta);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String htmlDoBanco = empresa.getLayoutHtmlRecibo();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><head><style>body{font-family: sans-serif; font-size: 14px; margin: 20px;}</style></head><body><h2 style='text-align:center;'>RECIBO DE RECEBIMENTO</h2><hr/><b>Recebemos de:</b> <span th:text=\"${clienteNome}\"></span><br/><b>Referente a:</b> <span th:text=\"${conta.descricao}\"></span><br/><b>Valor:</b> R$ <span th:text=\"${#numbers.formatDecimal(valorConta, 1, 'POINT', 2, 'COMMA')}\"></span><br/><hr/><p style='text-align:center; font-size:10px;'>Emitido em: <span th:text=\"${dataEmissao}\"></span></p></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo_Recebimento_" + conta.getId() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }

    @GetMapping("/contas-a-receber/relatorio-pdf")
    public ResponseEntity<byte[]> imprimirRelatorioReceberGeral(
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        byte[] pdf = gerarPdfRelatorioReceberBase(busca, dataInicio, dataFim, status, tipoDataFiltro);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Relatorio_Contas_Receber.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/contas-a-receber/relatorio/whatsapp")
    public ResponseEntity<?> enviarRelatorioReceberWhatsApp(
            @RequestParam String telefone,
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        byte[] pdf = gerarPdfRelatorioReceberBase(busca, dataInicio, dataFim, status, tipoDataFiltro);

        try {
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Relatorio_Contas_Receber.pdf", "Olá! Segue o Relatório de Contas a Receber solicitado via ERP.");
            return ResponseEntity.ok(Map.of("mensagem", "Relatório disparado pro WhatsApp!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro na API do Zap: " + e.getMessage()));
        }
    }


    // =======================================================================
    // ⚙️ MÉTODOS AUXILIARES DE GERAÇÃO DE PDF (PAGAR E RECEBER)
    // =======================================================================

    private byte[] gerarPdfRelatorioPagarBase(String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        List<ContaPagar> todasContas = contaPagarRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "dataVencimento")
        );

        List<ContaPagar> contasFiltradas = todasContas.stream().filter(c -> {
            boolean matchBusca = true;
            if (!busca.isEmpty()) {
                String termo = busca.toLowerCase();
                String forn = (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome().toLowerCase() : "";
                String desc = c.getDescricao() != null ? c.getDescricao().toLowerCase() : "";
                matchBusca = forn.contains(termo) || desc.contains(termo);
            }

            String dataAlvo = "";
            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) dataAlvo = c.getDataPagamento().toString();
            else if (tipoDataFiltro.equals("VENCIMENTO") && c.getDataVencimento() != null) dataAlvo = c.getDataVencimento().toString();

            String dataCurta = dataAlvo.length() >= 10 ? dataAlvo.substring(0, 10) : dataAlvo;
            boolean matchInicio = dataInicio.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0);
            boolean matchFim = dataFim.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0);

            boolean matchStatus = true;
            String statusConta = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            if (status.equals("PAGAS")) matchStatus = statusConta.contains("PAG") || statusConta.contains("LIQUID");
            else if (status.equals("PENDENTES")) matchStatus = !statusConta.contains("PAG") && !statusConta.contains("LIQUID");

            return matchBusca && matchInicio && matchFim && matchStatus;
        }).collect(Collectors.toList());

        double totalGeral = contasFiltradas.stream().mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0).sum();

        String tituloDinamico = "Relatório de Contas a Pagar (Geral)";
        if (status.equals("PAGAS")) tituloDinamico = "Relatório de Contas Pagas (Liquidadas)";
        else if (status.equals("PENDENTES")) tituloDinamico = "Relatório de Contas a Pagar (Pendentes)";

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        List<Map<String, Object>> listaMastigada = contasFiltradas.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("fornecedorNome", (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome() : "Diversos");
            map.put("descricao", c.getDescricao() != null ? c.getDescricao() : "");

            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) {
                map.put("dataVencimento", java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataPagamento()));
            } else {
                map.put("dataVencimento", c.getDataVencimento() != null ? java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataVencimento()) : "-");
            }

            map.put("valor", c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0);
            String st = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "PAGO" : "PENDENTE");
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasPagar();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><body><h2 th:text=\"${tituloRelatorio}\">Relatório</h2><p>Total: R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></p><table><tr><th>Fornecedor</th><th>Data</th><th>Status</th><th>Valor</th></tr><tr th:each=\"c : ${contas}\"><td th:text=\"${c.fornecedorNome}\"></td><td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td></tr></table></body></html>";
        }
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    private byte[] gerarPdfRelatorioReceberBase(String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        List<ContaReceber> todasContas = contaReceberRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "dataVencimento")
        );

        List<ContaReceber> contasFiltradas = todasContas.stream().filter(c -> {
            boolean matchBusca = true;
            if (!busca.isEmpty()) {
                String termo = busca.toLowerCase();
                String cliente = (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome().toLowerCase() : "";
                String desc = c.getDescricao() != null ? c.getDescricao().toLowerCase() : "";
                matchBusca = cliente.contains(termo) || desc.contains(termo);
            }

            String dataAlvo = "";
            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) dataAlvo = c.getDataPagamento().toString();
            else if (tipoDataFiltro.equals("VENCIMENTO") && c.getDataVencimento() != null) dataAlvo = c.getDataVencimento().toString();

            String dataCurta = dataAlvo.length() >= 10 ? dataAlvo.substring(0, 10) : dataAlvo;
            boolean matchInicio = dataInicio.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0);
            boolean matchFim = dataFim.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0);

            boolean matchStatus = true;
            String statusConta = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            if (status.equals("PAGAS")) matchStatus = statusConta.contains("PAG") || statusConta.contains("LIQUID");
            else if (status.equals("PENDENTES")) matchStatus = !statusConta.contains("PAG") && !statusConta.contains("LIQUID");

            return matchBusca && matchInicio && matchFim && matchStatus;
        }).collect(Collectors.toList());

        double totalGeral = contasFiltradas.stream().mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0).sum();

        String tituloDinamico = "Relatório de Contas a Receber (Geral)";
        if (status.equals("PAGAS")) tituloDinamico = "Relatório de Contas Recebidas";
        else if (status.equals("PENDENTES")) tituloDinamico = "Relatório de Contas a Receber (Pendentes)";

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        List<Map<String, Object>> listaMastigada = contasFiltradas.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("fornecedorNome", (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome() : "Consumidor");
            map.put("descricao", c.getDescricao() != null ? c.getDescricao() : "");

            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) {
                map.put("dataVencimento", java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataPagamento()));
            } else {
                map.put("dataVencimento", c.getDataVencimento() != null ? java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataVencimento()) : "-");
            }

            map.put("valor", c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0);
            String st = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "RECEBIDO" : "PENDENTE");
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasReceber();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><body><h2 th:text=\"${tituloRelatorio}\">Relatório</h2><p>Total: R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></p><table><tr><th>Cliente</th><th>Data</th><th>Status</th><th>Valor</th></tr><tr th:each=\"c : ${contas}\"><td th:text=\"${c.fornecedorNome}\"></td><td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td></tr></table></body></html>";
        }
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    // =======================================================================
    // 🟦 MÓDULO: EXTRATO FINANCEIRO DE CLIENTES E FORNECEDORES
    // =======================================================================

    @GetMapping("/extrato-cliente/{parceiroId}/pdf")
    public ResponseEntity<byte[]> imprimirExtratoCliente(
            @PathVariable Long parceiroId,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim) {
        
        byte[] pdf = gerarPdfExtratoCliente(parceiroId, dataInicio, dataFim);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Extrato_Cliente_" + parceiroId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/extrato-fornecedor/{parceiroId}/pdf")
    public ResponseEntity<byte[]> imprimirExtratoFornecedor(
            @PathVariable Long parceiroId,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim) {
        
        byte[] pdf = gerarPdfExtratoFornecedor(parceiroId, dataInicio, dataFim);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Extrato_Fornecedor_" + parceiroId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/extrato-cliente/{parceiroId}/whatsapp")
    public ResponseEntity<?> enviarExtratoClienteWhatsApp(
            @PathVariable Long parceiroId,
            @RequestParam String telefone,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim) {
        
        try {
            byte[] pdf = gerarPdfExtratoCliente(parceiroId, dataInicio, dataFim);
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Extrato_Cliente.pdf", 
                "Olá! Segue em anexo seu Extrato Financeiro atualizado. Favor conferir e retornar se houver pendências.");
            return ResponseEntity.ok(Map.of("mensagem", "Extrato enviado para o WhatsApp com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao disparar WhatsApp: " + e.getMessage()));
        }
    }

    @PostMapping("/extrato-fornecedor/{parceiroId}/whatsapp")
    public ResponseEntity<?> enviarExtratoFornecedorWhatsApp(
            @PathVariable Long parceiroId,
            @RequestParam String telefone,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim) {
        
        try {
            byte[] pdf = gerarPdfExtratoFornecedor(parceiroId, dataInicio, dataFim);
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Extrato_Fornecedor.pdf", 
                "Olá! Segue em anexo seu Extrato de Pagamentos. Favor conferir e nos retornar em caso de dúvidas.");
            return ResponseEntity.ok(Map.of("mensagem", "Extrato enviado para o WhatsApp com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao disparar WhatsApp: " + e.getMessage()));
        }
    }

    // ⚙️ MÉTODO AUXILIAR: Gera PDF do Extrato do Cliente
    private byte[] gerarPdfExtratoCliente(Long parceiroId, String dataInicio, String dataFim) {
        var parceiro = financeiroService.findParceiro(parceiroId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));
        
        // Busca todas as contas a receber do cliente
        List<ContaReceber> todasContas = contaReceberRepository.findAll()
                .stream()
                .filter(c -> c.getParceiro() != null && c.getParceiro().getId().equals(parceiroId))
                .collect(Collectors.toList());

        // Filtra por período
        List<ContaReceber> contasFiltradas = todasContas.stream().filter(c -> {
            if (c.getDataVencimento() == null) return false;
            
            String dataCurta = c.getDataVencimento().toString().substring(0, 10);
            boolean matchInicio = dataInicio.isEmpty() || dataCurta.compareTo(dataInicio) >= 0;
            boolean matchFim = dataFim.isEmpty() || dataCurta.compareTo(dataFim) <= 0;
            
            return matchInicio && matchFim;
        }).sorted((a, b) -> {
            if (a.getDataVencimento() != null && b.getDataVencimento() != null)
                return a.getDataVencimento().compareTo(b.getDataVencimento());
            return 0;
        }).collect(Collectors.toList());

        // Calcula totais
        double totalPendente = contasFiltradas.stream()
                .filter(c -> c.getStatus() != null && !c.getStatus().toString().contains("PAG") && !c.getStatus().toString().contains("LIQUID"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0)
                .sum();
        
        double totalRecebido = contasFiltradas.stream()
                .filter(c -> c.getStatus() != null && (c.getStatus().toString().contains("PAG") || c.getStatus().toString().contains("LIQUID")))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0)
                .sum();
        
        double totalGeral = totalPendente + totalRecebido;

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // Prepara dados para exibição
        List<Map<String, Object>> listaMastigada = contasFiltradas.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("descricao", c.getDescricao() != null ? c.getDescricao() : "-");
            map.put("dataVencimento", c.getDataVencimento() != null ? 
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataVencimento()) : "-");
            map.put("dataPagamento", c.getDataPagamento() != null ? 
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataPagamento()) : "-");
            map.put("valor", c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0);
            
            String st = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "RECEBIDO" : "PENDENTE");
            
            // Calcula dias de atraso
            if (c.getDataVencimento() != null && st.contains("PENDENTE")) {
                long diasAtraso = java.time.temporal.ChronoUnit.DAYS.between(c.getDataVencimento().toLocalDate(), java.time.LocalDate.now());
                map.put("diasAtraso", diasAtraso > 0 ? diasAtraso : 0);
            } else {
                map.put("diasAtraso", 0);
            }
            
            return map;
        }).collect(Collectors.toList());

        // Monta variáveis para template
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("parceiro", parceiro);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalPendente", totalPendente);
        variaveis.put("totalRecebido", totalRecebido);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataInicio", dataInicio);
        variaveis.put("dataFim", dataFim);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String htmlDoBanco = empresa.getLayoutHtmlExtratoCliente();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            // Template padrão professionalizado
            htmlDoBanco = gerarTemplateExtratoClientePadrao();
        }
        
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    // ⚙️ MÉTODO AUXILIAR: Gera PDF do Extrato do Fornecedor
    private byte[] gerarPdfExtratoFornecedor(Long parceiroId, String dataInicio, String dataFim) {
        var parceiro = financeiroService.findParceiro(parceiroId)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado."));
        
        // Busca todas as contas a pagar do fornecedor
        List<ContaPagar> todasContas = contaPagarRepository.findAll()
                .stream()
                .filter(c -> c.getParceiro() != null && c.getParceiro().getId().equals(parceiroId))
                .collect(Collectors.toList());

        // Filtra por período
        List<ContaPagar> contasFiltradas = todasContas.stream().filter(c -> {
            if (c.getDataVencimento() == null) return false;
            
            String dataCurta = c.getDataVencimento().toString().substring(0, 10);
            boolean matchInicio = dataInicio.isEmpty() || dataCurta.compareTo(dataInicio) >= 0;
            boolean matchFim = dataFim.isEmpty() || dataCurta.compareTo(dataFim) <= 0;
            
            return matchInicio && matchFim;
        }).sorted((a, b) -> {
            if (a.getDataVencimento() != null && b.getDataVencimento() != null)
                return a.getDataVencimento().compareTo(b.getDataVencimento());
            return 0;
        }).collect(Collectors.toList());

        // Calcula totais
        double totalPendente = contasFiltradas.stream()
                .filter(c -> c.getStatus() != null && !c.getStatus().toString().contains("PAG") && !c.getStatus().toString().contains("LIQUID"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0)
                .sum();
        
        double totalPago = contasFiltradas.stream()
                .filter(c -> c.getStatus() != null && (c.getStatus().toString().contains("PAG") || c.getStatus().toString().contains("LIQUID")))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0)
                .sum();
        
        double totalGeral = totalPendente + totalPago;

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // Prepara dados para exibição
        List<Map<String, Object>> listaMastigada = contasFiltradas.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("descricao", c.getDescricao() != null ? c.getDescricao() : "-");
            map.put("dataVencimento", c.getDataVencimento() != null ? 
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataVencimento()) : "-");
            map.put("dataPagamento", c.getDataPagamento() != null ? 
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(c.getDataPagamento()) : "-");
            map.put("valor", c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0);
            
            String st = c.getStatus() != null ? c.getStatus().toString() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "PAGO" : "PENDENTE");
            
            // Calcula dias de atraso
            if (c.getDataVencimento() != null && st.contains("PENDENTE")) {
                long diasAtraso = java.time.temporal.ChronoUnit.DAYS.between(c.getDataVencimento().toLocalDate(), java.time.LocalDate.now());
                map.put("diasAtraso", diasAtraso > 0 ? diasAtraso : 0);
            } else {
                map.put("diasAtraso", 0);
            }
            
            return map;
        }).collect(Collectors.toList());

        // Monta variáveis para template
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("parceiro", parceiro);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalPendente", totalPendente);
        variaveis.put("totalPago", totalPago);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataInicio", dataInicio);
        variaveis.put("dataFim", dataFim);
        variaveis.put("dataEmissao", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String htmlDoBanco = empresa.getLayoutHtmlExtratoFornecedor();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            // Template padrão professionalizado
            htmlDoBanco = gerarTemplateExtratoFornecedorPadrao();
        }
        
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    // 🎨 TEMPLATE PADRÃO: Extrato do Cliente
    private String gerarTemplateExtratoClientePadrao() {
        return "<!DOCTYPE html>\n" +
            "<html xmlns:th=\"http://www.thymeleaf.org\">\n" +
            "<head>\n" +
            "    <meta charset=\"UTF-8\"/>\n" +
            "    <title>Extrato Financeiro - Cliente</title>\n" +
            "    <style>\n" +
            "        @page { size: A4 portrait; margin: 15mm; }\n" +
            "        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; }\n" +
            "        .header { border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; display: table; width: 100%; }\n" +
            "        .header-logo { display: table-cell; vertical-align: middle; width: 80px; }\n" +
            "        .header-logo img { max-width: 70px; max-height: 70px; }\n" +
            "        .header-info { display: table-cell; vertical-align: middle; padding-left: 15px; }\n" +
            "        .header-info h1 { margin: 0; font-size: 18px; color: #0f172a; font-weight: bold; }\n" +
            "        .header-info p { margin: 2px 0; font-size: 10px; color: #64748b; }\n" +
            "        .header-meta { display: table-cell; vertical-align: middle; text-align: right; font-size: 11px; color: #64748b; }\n" +
            "        .titulo { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; color: #1e40af; text-transform: uppercase; }\n" +
            "        .info-parceiro { background: #f1f5f9; padding: 12px; margin: 15px 0; border-left: 4px solid #1e40af; }\n" +
            "        .info-parceiro p { margin: 4px 0; font-size: 11px; }\n" +
            "        .info-parceiro strong { color: #0f172a; }\n" +
            "        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }\n" +
            "        thead { background-color: #1e40af; display: table-header-group; }\n" +
            "        th { padding: 10px 8px; text-align: left; color: #fff; font-weight: bold; text-transform: uppercase; font-size: 10px; }\n" +
            "        td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }\n" +
            "        tbody tr:nth-child(even) { background-color: #f8fafc; }\n" +
            "        .col-id { width: 5%; text-align: center; color: #64748b; }\n" +
            "        .col-descricao { width: 35%; }\n" +
            "        .col-data { width: 12%; text-align: center; }\n" +
            "        .col-dias { width: 8%; text-align: center; font-weight: bold; }\n" +
            "        .col-status { width: 12%; text-align: center; }\n" +
            "        .col-valor { width: 15%; text-align: right; font-weight: bold; }\n" +
            "        .status-pendente { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }\n" +
            "        .status-recebido { background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }\n" +
            "        .resumo { margin-top: 20px; border-top: 2px solid #1e293b; padding-top: 15px; }\n" +
            "        .resumo-linha { display: table; width: 100%; margin: 8px 0; }\n" +
            "        .resumo-label { display: table-cell; width: 70%; font-size: 12px; color: #475569; }\n" +
            "        .resumo-valor { display: table-cell; text-align: right; font-size: 12px; font-weight: bold; }\n" +
            "        .resumo-total { font-size: 14px; color: #1e40af; }\n" +
            "        .footer { position: fixed; bottom: -10mm; left: 0; right: 0; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; }\n" +
            "    </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <div class=\"header\">\n" +
            "        <div class=\"header-logo\">\n" +
            "            <img th:if=\"${empresa.logoBase64 != null and empresa.logoBase64 != ''}\" th:src=\"${empresa.logoBase64}\" alt=\"Logo\" />\n" +
            "        </div>\n" +
            "        <div class=\"header-info\">\n" +
            "            <h1 th:text=\"${empresa.nomeFantasia != null ? empresa.nomeFantasia : 'EMPRESA'}\">EMPRESA</h1>\n" +
            "            <p th:text=\"'CNPJ: ' + ${empresa.cnpj != null ? empresa.cnpj : '00.000.000/0000-00'}\">CNPJ</p>\n" +
            "            <p th:if=\"${empresa.telefone}\" th:text=\"'Tel: ' + ${empresa.telefone}\">TEL</p>\n" +
            "        </div>\n" +
            "        <div class=\"header-meta\">\n" +
            "            <strong>EXTRATO FINANCEIRO</strong><br/>\n" +
            "            Emitido em:<br/>\n" +
            "            <span th:text=\"${dataEmissao}\">00/00/0000 00:00</span>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "\n" +
            "    <div class=\"titulo\">Extrato Financeiro - Contas a Receber</div>\n" +
            "\n" +
            "    <div class=\"info-parceiro\">\n" +
            "        <p><strong>Cliente:</strong> <span th:text=\"${parceiro.nome}\">NOME DO CLIENTE</span></p>\n" +
            "        <p><strong>Documento:</strong> <span th:text=\"${parceiro.documento}\">00.000.000/0000-00</span></p>\n" +
            "        <p th:if=\"${parceiro.email}\"><strong>Email:</strong> <span th:text=\"${parceiro.email}\">email@example.com</span></p>\n" +
            "        <p th:if=\"${parceiro.telefone}\"><strong>Telefone:</strong> <span th:text=\"${parceiro.telefone}\">(00) 0000-0000</span></p>\n" +
            "    </div>\n" +
            "\n" +
            "    <table>\n" +
            "        <thead>\n" +
            "            <tr>\n" +
            "                <th class=\"col-id\">#</th>\n" +
            "                <th class=\"col-descricao\">Descrição</th>\n" +
            "                <th class=\"col-data\">Vencimento</th>\n" +
            "                <th class=\"col-dias\">Dias</th>\n" +
            "                <th class=\"col-status\">Status</th>\n" +
            "                <th class=\"col-valor\">Valor (R$)</th>\n" +
            "            </tr>\n" +
            "        </thead>\n" +
            "        <tbody>\n" +
            "            <tr th:each=\"c : ${contas}\">\n" +
            "                <td class=\"col-id\" th:text=\"${c.id}\">0</td>\n" +
            "                <td class=\"col-descricao\" th:text=\"${c.descricao}\">Descrição</td>\n" +
            "                <td class=\"col-data\" th:text=\"${c.dataVencimento}\">00/00/0000</td>\n" +
            "                <td class=\"col-dias\" th:text=\"${c.diasAtraso}\">0</td>\n" +
            "                <td class=\"col-status\">\n" +
            "                    <span th:if=\"${c.status == 'PENDENTE'}\" class=\"status-pendente\" th:text=\"${c.status}\">PENDENTE</span>\n" +
            "                    <span th:if=\"${c.status == 'RECEBIDO'}\" class=\"status-recebido\" th:text=\"${c.status}\">RECEBIDO</span>\n" +
            "                </td>\n" +
            "                <td class=\"col-valor\" th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\">0,00</td>\n" +
            "            </tr>\n" +
            "        </tbody>\n" +
            "    </table>\n" +
            "\n" +
            "    <div class=\"resumo\">\n" +
            "        <div class=\"resumo-linha\">\n" +
            "            <div class=\"resumo-label\">Total Pendente:</div>\n" +
            "            <div class=\"resumo-valor\" style=\"color: #dc2626;\">R$ <span th:text=\"${#numbers.formatDecimal(totalPendente, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "        <div class=\"resumo-linha\">\n" +
            "            <div class=\"resumo-label\">Total Recebido:</div>\n" +
            "            <div class=\"resumo-valor\" style=\"color: #16a34a;\">R$ <span th:text=\"${#numbers.formatDecimal(totalRecebido, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "        <div class=\"resumo-linha\" style=\"margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;\">\n" +
            "            <div class=\"resumo-label resumo-total\">TOTAL GERAL:</div>\n" +
            "            <div class=\"resumo-valor resumo-total\">R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "\n" +
            "    <div class=\"footer\">\n" +
            "        Este extrato é para fins de conferência. Em caso de dúvidas, favor entrar em contato conosco.<br/>\n" +
            "        Gerado automaticamente pelo Sistema ERP em <span th:text=\"${dataEmissao}\"></span>\n" +
            "    </div>\n" +
            "</body>\n" +
            "</html>";
    }

    // 🎨 TEMPLATE PADRÃO: Extrato do Fornecedor
    private String gerarTemplateExtratoFornecedorPadrao() {
        return "<!DOCTYPE html>\n" +
            "<html xmlns:th=\"http://www.thymeleaf.org\">\n" +
            "<head>\n" +
            "    <meta charset=\"UTF-8\"/>\n" +
            "    <title>Extrato Financeiro - Fornecedor</title>\n" +
            "    <style>\n" +
            "        @page { size: A4 portrait; margin: 15mm; }\n" +
            "        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; }\n" +
            "        .header { border-bottom: 3px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px; display: table; width: 100%; }\n" +
            "        .header-logo { display: table-cell; vertical-align: middle; width: 80px; }\n" +
            "        .header-logo img { max-width: 70px; max-height: 70px; }\n" +
            "        .header-info { display: table-cell; vertical-align: middle; padding-left: 15px; }\n" +
            "        .header-info h1 { margin: 0; font-size: 18px; color: #0f172a; font-weight: bold; }\n" +
            "        .header-info p { margin: 2px 0; font-size: 10px; color: #64748b; }\n" +
            "        .header-meta { display: table-cell; vertical-align: middle; text-align: right; font-size: 11px; color: #64748b; }\n" +
            "        .titulo { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; color: #7c3aed; text-transform: uppercase; }\n" +
            "        .info-parceiro { background: #faf5ff; padding: 12px; margin: 15px 0; border-left: 4px solid #7c3aed; }\n" +
            "        .info-parceiro p { margin: 4px 0; font-size: 11px; }\n" +
            "        .info-parceiro strong { color: #0f172a; }\n" +
            "        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }\n" +
            "        thead { background-color: #7c3aed; display: table-header-group; }\n" +
            "        th { padding: 10px 8px; text-align: left; color: #fff; font-weight: bold; text-transform: uppercase; font-size: 10px; }\n" +
            "        td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }\n" +
            "        tbody tr:nth-child(even) { background-color: #f8fafc; }\n" +
            "        .col-id { width: 5%; text-align: center; color: #64748b; }\n" +
            "        .col-descricao { width: 35%; }\n" +
            "        .col-data { width: 12%; text-align: center; }\n" +
            "        .col-dias { width: 8%; text-align: center; font-weight: bold; }\n" +
            "        .col-status { width: 12%; text-align: center; }\n" +
            "        .col-valor { width: 15%; text-align: right; font-weight: bold; }\n" +
            "        .status-pendente { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }\n" +
            "        .status-pago { background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }\n" +
            "        .resumo { margin-top: 20px; border-top: 2px solid #1e293b; padding-top: 15px; }\n" +
            "        .resumo-linha { display: table; width: 100%; margin: 8px 0; }\n" +
            "        .resumo-label { display: table-cell; width: 70%; font-size: 12px; color: #475569; }\n" +
            "        .resumo-valor { display: table-cell; text-align: right; font-size: 12px; font-weight: bold; }\n" +
            "        .resumo-total { font-size: 14px; color: #7c3aed; }\n" +
            "        .footer { position: fixed; bottom: -10mm; left: 0; right: 0; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; }\n" +
            "    </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <div class=\"header\">\n" +
            "        <div class=\"header-logo\">\n" +
            "            <img th:if=\"${empresa.logoBase64 != null and empresa.logoBase64 != ''}\" th:src=\"${empresa.logoBase64}\" alt=\"Logo\" />\n" +
            "        </div>\n" +
            "        <div class=\"header-info\">\n" +
            "            <h1 th:text=\"${empresa.nomeFantasia != null ? empresa.nomeFantasia : 'EMPRESA'}\">EMPRESA</h1>\n" +
            "            <p th:text=\"'CNPJ: ' + ${empresa.cnpj != null ? empresa.cnpj : '00.000.000/0000-00'}\">CNPJ</p>\n" +
            "            <p th:if=\"${empresa.telefone}\" th:text=\"'Tel: ' + ${empresa.telefone}\">TEL</p>\n" +
            "        </div>\n" +
            "        <div class=\"header-meta\">\n" +
            "            <strong>EXTRATO FINANCEIRO</strong><br/>\n" +
            "            Emitido em:<br/>\n" +
            "            <span th:text=\"${dataEmissao}\">00/00/0000 00:00</span>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "\n" +
            "    <div class=\"titulo\">Extrato Financeiro - Contas a Pagar</div>\n" +
            "\n" +
            "    <div class=\"info-parceiro\">\n" +
            "        <p><strong>Fornecedor:</strong> <span th:text=\"${parceiro.nome}\">NOME DO FORNECEDOR</span></p>\n" +
            "        <p><strong>Documento:</strong> <span th:text=\"${parceiro.documento}\">00.000.000/0000-00</span></p>\n" +
            "        <p th:if=\"${parceiro.email}\"><strong>Email:</strong> <span th:text=\"${parceiro.email}\">email@example.com</span></p>\n" +
            "        <p th:if=\"${parceiro.telefone}\"><strong>Telefone:</strong> <span th:text=\"${parceiro.telefone}\">(00) 0000-0000</span></p>\n" +
            "    </div>\n" +
            "\n" +
            "    <table>\n" +
            "        <thead>\n" +
            "            <tr>\n" +
            "                <th class=\"col-id\">#</th>\n" +
            "                <th class=\"col-descricao\">Descrição</th>\n" +
            "                <th class=\"col-data\">Vencimento</th>\n" +
            "                <th class=\"col-dias\">Dias</th>\n" +
            "                <th class=\"col-status\">Status</th>\n" +
            "                <th class=\"col-valor\">Valor (R$)</th>\n" +
            "            </tr>\n" +
            "        </thead>\n" +
            "        <tbody>\n" +
            "            <tr th:each=\"c : ${contas}\">\n" +
            "                <td class=\"col-id\" th:text=\"${c.id}\">0</td>\n" +
            "                <td class=\"col-descricao\" th:text=\"${c.descricao}\">Descrição</td>\n" +
            "                <td class=\"col-data\" th:text=\"${c.dataVencimento}\">00/00/0000</td>\n" +
            "                <td class=\"col-dias\" th:text=\"${c.diasAtraso}\">0</td>\n" +
            "                <td class=\"col-status\">\n" +
            "                    <span th:if=\"${c.status == 'PENDENTE'}\" class=\"status-pendente\" th:text=\"${c.status}\">PENDENTE</span>\n" +
            "                    <span th:if=\"${c.status == 'PAGO'}\" class=\"status-pago\" th:text=\"${c.status}\">PAGO</span>\n" +
            "                </td>\n" +
            "                <td class=\"col-valor\" th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\">0,00</td>\n" +
            "            </tr>\n" +
            "        </tbody>\n" +
            "    </table>\n" +
            "\n" +
            "    <div class=\"resumo\">\n" +
            "        <div class=\"resumo-linha\">\n" +
            "            <div class=\"resumo-label\">Total a Pagar:</div>\n" +
            "            <div class=\"resumo-valor\" style=\"color: #dc2626;\">R$ <span th:text=\"${#numbers.formatDecimal(totalPendente, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "        <div class=\"resumo-linha\">\n" +
            "            <div class=\"resumo-label\">Total Pago:</div>\n" +
            "            <div class=\"resumo-valor\" style=\"color: #16a34a;\">R$ <span th:text=\"${#numbers.formatDecimal(totalPago, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "        <div class=\"resumo-linha\" style=\"margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;\">\n" +
            "            <div class=\"resumo-label resumo-total\">TOTAL GERAL:</div>\n" +
            "            <div class=\"resumo-valor resumo-total\">R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\">0,00</span></div>\n" +
            "        </div>\n" +
            "    </div>\n" +
            "\n" +
            "    <div class=\"footer\">\n" +
            "        Este extrato é para fins de conferência. Em caso de dúvidas, favor entrar em contato conosco.<br/>\n" +
            "        Gerado automaticamente pelo Sistema ERP em <span th:text=\"${dataEmissao}\"></span>\n" +
            "    </div>\n" +
            "</body>\n" +
            "</html>";
    }
}

