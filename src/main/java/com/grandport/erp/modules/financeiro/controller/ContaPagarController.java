package com.grandport.erp.modules.financeiro.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/financeiro/contas-a-pagar")
public class ContaPagarController {

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.ContaPagarRepository contaPagarRepository;

    // 🚀 INJEÇÃO DO MOTOR DE WHATSAPP
    @Autowired
    private com.grandport.erp.modules.vendas.service.WhatsAppService whatsappService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarTodasAsContas() {
        List<com.grandport.erp.modules.financeiro.model.ContaPagar> contas = contaPagarRepository.findAll(
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

            String status = c.getStatus() != null ? c.getStatus().name() : "PENDENTE";
            map.put("status", status);

            boolean atrasado = false;
            if (c.getDataVencimento() != null && !status.contains("PAG") && !status.contains("LIQUID")) {
                atrasado = c.getDataVencimento().isBefore(java.time.LocalDateTime.now());
            }
            map.put("atrasado", atrasado);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(listaMastigada);
    }

    @GetMapping("/{id}/recibo-pdf")
    public ResponseEntity<byte[]> imprimirReciboPagamento(@PathVariable Long id) {
        var conta = contaPagarRepository.findById(id).orElse(null);
        if (conta == null) return ResponseEntity.badRequest().build();

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        String nomeFornecedor = (conta.getParceiro() != null && conta.getParceiro().getNome() != null) ? conta.getParceiro().getNome() : "Diversos";
        double valorConta = conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("conta", conta);
        variaveis.put("fornecedorNome", nomeFornecedor);
        variaveis.put("valorConta", valorConta);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String htmlDoBanco = empresa.getLayoutHtmlReciboPagamento();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\">" +
                    "<head><style>body{font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px;}</style></head>" +
                    "<body><h2 style='text-align:center;'>RECIBO DE PAGAMENTO</h2>" +
                    "<hr/><b>Fornecedor:</b> <span th:text=\"${fornecedorNome}\"></span><br/>" +
                    "<b>Descricao:</b> <span th:text=\"${conta.descricao}\"></span><br/>" +
                    "<b>Valor Pago:</b> R$ <span th:text=\"${#numbers.formatDecimal(valorConta, 1, 'POINT', 2, 'COMMA')}\"></span><br/>" +
                    "<hr/><p style='text-align:center; font-size:10px;'>Emitido em: <span th:text=\"${dataEmissao}\"></span></p>" +
                    "</body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo_" + conta.getId() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }

    @GetMapping("/relatorio-pdf")
    public ResponseEntity<byte[]> imprimirRelatorioGeral(
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        List<com.grandport.erp.modules.financeiro.model.ContaPagar> todasContas = contaPagarRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "dataVencimento")
        );

        List<com.grandport.erp.modules.financeiro.model.ContaPagar> contasFiltradas = todasContas.stream().filter(c -> {
            boolean matchBusca = true;
            if (!busca.isEmpty()) {
                String termo = busca.toLowerCase();
                String forn = (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome().toLowerCase() : "";
                String desc = c.getDescricao() != null ? c.getDescricao().toLowerCase() : "";
                String idStr = c.getId() != null ? c.getId().toString() : "";
                matchBusca = forn.contains(termo) || desc.contains(termo) || idStr.contains(termo);
            }

            String dataAlvo = "";
            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) {
                dataAlvo = c.getDataPagamento().toString();
            } else if (tipoDataFiltro.equals("VENCIMENTO") && c.getDataVencimento() != null) {
                dataAlvo = c.getDataVencimento().toString();
            }

            String dataCurta = dataAlvo.length() >= 10 ? dataAlvo.substring(0, 10) : dataAlvo;

            boolean matchInicio = true;
            boolean matchFim = true;

            if (!dataInicio.isEmpty()) {
                matchInicio = !dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0;
            }
            if (!dataFim.isEmpty()) {
                matchFim = !dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0;
            }

            boolean matchStatus = true;
            String statusConta = c.getStatus() != null ? c.getStatus().name() : "PENDENTE";

            if (status.equals("PAGAS")) {
                matchStatus = statusConta.contains("PAG") || statusConta.contains("LIQUID");
            } else if (status.equals("PENDENTES")) {
                matchStatus = !statusConta.contains("PAG") && !statusConta.contains("LIQUID");
            }

            return matchBusca && matchInicio && matchFim && matchStatus;
        }).collect(Collectors.toList());

        double totalGeral = contasFiltradas.stream()
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0)
                .sum();

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

            String st = c.getStatus() != null ? c.getStatus().name() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "PAGO" : "PENDENTE");

            return map;
        }).collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasPagar();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\">" +
                    "<head><style>body{font-family: sans-serif; margin: 20px;} table{width: 100%; border-collapse: collapse; margin-top: 15px;} th, td{border: 1px solid #ccc; padding: 8px; text-align: left;}</style></head>" +
                    "<body><h2 th:text=\"${tituloRelatorio}\">Relatório de Contas</h2>" +
                    "<p>Total Listado: <b>R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></b></p>" +
                    "<table><tr><th>ID</th><th>Fornecedor / Descrição</th><th>Data (" + (tipoDataFiltro.equals("PAGAMENTO") ? "Pgto" : "Venc") + ")</th><th>Status</th><th>Valor (R$)</th></tr>" +
                    "<tr th:each=\"c : ${contas}\">" +
                    "<td th:text=\"${c.id}\"></td><td><strong th:text=\"${c.fornecedorNome}\"></strong><br/><span style='font-size:12px; color:#555;' th:text=\"${c.descricao}\"></span></td>" +
                    "<td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td>" +
                    "</tr></table></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Relatorio_Contas_Pagar.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }

    // =======================================================================
    // 🟢 ENVIAR RELATÓRIO GERAL DIRETO PRO WHATSAPP
    // =======================================================================
    @PostMapping("/relatorio/whatsapp")
    public ResponseEntity<?> enviarRelatorioWhatsApp(
            @RequestParam String telefone,
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim,
            @RequestParam(required = false, defaultValue = "TODAS") String status,
            @RequestParam(required = false, defaultValue = "VENCIMENTO") String tipoDataFiltro) {

        List<com.grandport.erp.modules.financeiro.model.ContaPagar> todasContas = contaPagarRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "dataVencimento")
        );

        List<com.grandport.erp.modules.financeiro.model.ContaPagar> contasFiltradas = todasContas.stream().filter(c -> {
            boolean matchBusca = true;
            if (!busca.isEmpty()) {
                String termo = busca.toLowerCase();
                String forn = (c.getParceiro() != null && c.getParceiro().getNome() != null) ? c.getParceiro().getNome().toLowerCase() : "";
                String desc = c.getDescricao() != null ? c.getDescricao().toLowerCase() : "";
                matchBusca = forn.contains(termo) || desc.contains(termo);
            }

            String dataAlvo = "";
            if (tipoDataFiltro.equals("PAGAMENTO") && c.getDataPagamento() != null) {
                dataAlvo = c.getDataPagamento().toString();
            } else if (tipoDataFiltro.equals("VENCIMENTO") && c.getDataVencimento() != null) {
                dataAlvo = c.getDataVencimento().toString();
            }

            String dataCurta = dataAlvo.length() >= 10 ? dataAlvo.substring(0, 10) : dataAlvo;
            boolean matchInicio = dataInicio.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0);
            boolean matchFim = dataFim.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0);

            boolean matchStatus = true;
            String statusConta = c.getStatus() != null ? c.getStatus().name() : "PENDENTE";
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
            String st = c.getStatus() != null ? c.getStatus().name() : "PENDENTE";
            map.put("status", st.contains("PAG") || st.contains("LIQUID") ? "PAGO" : "PENDENTE");

            return map;
        }).collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", listaMastigada);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasPagar();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\">" +
                    "<head><style>body{font-family: sans-serif; margin: 20px;} table{width: 100%; border-collapse: collapse; margin-top: 15px;} th, td{border: 1px solid #ccc; padding: 8px; text-align: left;}</style></head>" +
                    "<body><h2 th:text=\"${tituloRelatorio}\">Relatório de Contas</h2>" +
                    "<p>Total Listado: <b>R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></b></p>" +
                    "<table><tr><th>ID</th><th>Fornecedor / Descrição</th><th>Data (" + (tipoDataFiltro.equals("PAGAMENTO") ? "Pgto" : "Venc") + ")</th><th>Status</th><th>Valor (R$)</th></tr>" +
                    "<tr th:each=\"c : ${contas}\">" +
                    "<td th:text=\"${c.id}\"></td><td><strong th:text=\"${c.fornecedorNome}\"></strong><br/><span style='font-size:12px; color:#555;' th:text=\"${c.descricao}\"></span></td>" +
                    "<td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td>" +
                    "</tr></table></body></html>";
        }

        // 🚀 O JAVA GERA O PDF E TRANSFORMA EM BASE64 SEM MOSTRAR NA TELA!
        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        try {
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(arquivoPdf);

            // 🚀 CHAMA O SEU SERVIÇO CURINGA DO WHATSAPP!
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Relatorio_Contas_Pagar.pdf", "Olá! Segue em anexo o Relatório de Contas a Pagar solicitado através do sistema ERP.");

            return ResponseEntity.ok(Map.of("mensagem", "Relatório disparado pro WhatsApp com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro na API do Zap: " + e.getMessage()));
        }
    }
}