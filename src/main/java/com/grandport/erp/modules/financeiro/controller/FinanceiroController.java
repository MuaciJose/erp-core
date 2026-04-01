package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.financeiro.service.FinanceiroDocumentoService;
import com.grandport.erp.modules.financeiro.service.FinanceiroRelatorioService;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/financeiro")
@Tag(name = "Financeiro", description = "Gestão de contas, transferências, extratos e DRE")
public class FinanceiroController {

    // =======================================================
    // ⚙️ INJEÇÕES DE DEPENDÊNCIA (Todos os Motores)
    // =======================================================
    @Autowired
    private FinanceiroService financeiroService;

    @Autowired
    private com.grandport.erp.modules.pdf.service.PdfService pdfService;

    @Autowired
    private ConfiguracaoAtualService configuracaoAtualService;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.ContaReceberRepository contaReceberRepository;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.ContaPagarRepository contaPagarRepository;

    @Autowired
    private com.grandport.erp.modules.vendas.service.WhatsAppService whatsappService;

    @Autowired
    private FinanceiroRelatorioService financeiroRelatorioService;

    @Autowired
    private FinanceiroDocumentoService financeiroDocumentoService;

    // =======================================================
    // 🏦 MÓDULO BANCÁRIO, EXTRATOS E DRE (Seus Métodos Originais)
    // =======================================================

    @GetMapping("/contas-bancarias")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_BANCOS', 'ROLE_CONCILIACAO', 'ROLE_CONTAS-PAGAR', 'ROLE_CONTAS-RECEBER', 'ROLE_DRE')")
    @Operation(summary = "Listar contas bancárias", description = "Retorna todas as contas bancárias ativas da empresa", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<List<ContaBancaria>> getContasBancarias() {
        return ResponseEntity.ok(financeiroService.listarContasBancarias());
    }

    @PostMapping("/contas-bancarias")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_BANCOS', 'ROLE_CONCILIACAO')")
    @Operation(summary = "Criar conta bancária", description = "Cria uma nova conta bancária com validações", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<ContaBancaria> criarContaBancaria(@Valid @RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(financeiroService.criarContaBancaria(conta));
    }

    @PutMapping("/contas-bancarias/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_BANCOS', 'ROLE_CONCILIACAO')")
    @Operation(summary = "Atualizar conta bancária", description = "Atualiza dados de uma conta bancária existente", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<ContaBancaria> atualizarContaBancaria(
            @PathVariable Long id,
            @Valid @RequestBody ContaBancaria conta) {
        return ResponseEntity.ok(financeiroService.atualizarContaBancaria(id, conta));
    }

    @DeleteMapping("/contas-bancarias/{id}")
    @PreAuthorize("hasAuthority('ROLE_USUARIOS')")
    @Operation(summary = "Deletar conta bancária (soft delete)", description = "Marca a conta como deletada (soft delete) mantendo auditoria", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<Void> excluirContaBancaria(@PathVariable Long id) {
        financeiroService.excluirContaBancaria(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contas-bancarias/transferir")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_BANCOS', 'ROLE_CONCILIACAO')")
    @Operation(summary = "Transferir entre contas", description = "Realiza transferência de valores entre contas bancárias", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<Void> transferir(@RequestBody TransferenciaDTO dto) {
        financeiroService.transferirEntreContas(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/extrato/{parceiroId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONTAS-PAGAR', 'ROLE_CONTAS-RECEBER', 'ROLE_BANCOS', 'ROLE_DRE')")
    @Operation(summary = "Gerar extrato", description = "Gera extrato consolidado para um parceiro", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<ExtratoParceiroDTO> getExtrato(@PathVariable Long parceiroId) {
        return ResponseEntity.ok(financeiroService.gerarExtratoParceiro(parceiroId));
    }

    @GetMapping("/dre")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_DRE', 'ROLE_CONTAS-PAGAR', 'ROLE_CONTAS-RECEBER')")
    @Operation(summary = "Calcular DRE", description = "Calcula Demonstração de Resultado do Exercício para um período", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<DreDTO> getDre(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth mesAno) {
        return ResponseEntity.ok(financeiroService.calcularDre(mesAno));
    }

    @GetMapping("/dre/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_DRE', 'ROLE_CONTAS-PAGAR', 'ROLE_CONTAS-RECEBER')")
    @Operation(summary = "Gerar DRE em PDF", description = "Gera relatório DRE em formato PDF", security = @SecurityRequirement(name = "Bearer"))
    public ResponseEntity<byte[]> imprimirDrePdf(@RequestParam String mesAno) {
        var dados = financeiroService.calcularDre(java.time.YearMonth.parse(mesAno));
        var empresa = obterConfiguracaoAtual();

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
        return ResponseEntity.ok(financeiroService.listarTodasAsContasPagar());
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
        byte[] arquivoPdf = financeiroDocumentoService.gerarReciboPagamento(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo_" + id + ".pdf")
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

        byte[] pdf = financeiroRelatorioService.gerarPdfRelatorioPagar(busca, dataInicio, dataFim, status, tipoDataFiltro);
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

        byte[] pdf = financeiroRelatorioService.gerarPdfRelatorioPagar(busca, dataInicio, dataFim, status, tipoDataFiltro);

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
        return ResponseEntity.ok(financeiroService.listarTodasAsContasReceber());
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
        byte[] arquivoPdf = financeiroDocumentoService.gerarReciboRecebimento(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Recibo_Recebimento_" + id + ".pdf")
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

        byte[] pdf = financeiroRelatorioService.gerarPdfRelatorioReceber(busca, dataInicio, dataFim, status, tipoDataFiltro);
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

        byte[] pdf = financeiroRelatorioService.gerarPdfRelatorioReceber(busca, dataInicio, dataFim, status, tipoDataFiltro);

        try {
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Relatorio_Contas_Receber.pdf", "Olá! Segue o Relatório de Contas a Receber solicitado via ERP.");
            return ResponseEntity.ok(Map.of("mensagem", "Relatório disparado pro WhatsApp!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro na API do Zap: " + e.getMessage()));
        }
    }


    // =======================================================================
    // 🟦 MÓDULO: EXTRATO FINANCEIRO DE CLIENTES E FORNECEDORES
    // =======================================================================

    @GetMapping("/extrato-cliente/{parceiroId}/pdf")
    public ResponseEntity<byte[]> imprimirExtratoCliente(
            @PathVariable Long parceiroId,
            @RequestParam(required = false, defaultValue = "") String dataInicio,
            @RequestParam(required = false, defaultValue = "") String dataFim) {
        
        byte[] pdf = financeiroDocumentoService.gerarExtratoCliente(parceiroId, dataInicio, dataFim);
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
        
        byte[] pdf = financeiroDocumentoService.gerarExtratoFornecedor(parceiroId, dataInicio, dataFim);
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
            byte[] pdf = financeiroDocumentoService.gerarExtratoCliente(parceiroId, dataInicio, dataFim);
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
            byte[] pdf = financeiroDocumentoService.gerarExtratoFornecedor(parceiroId, dataInicio, dataFim);
            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdf);
            whatsappService.enviarArquivoPdfBase64(telefone, pdfBase64, "Extrato_Fornecedor.pdf", 
                "Olá! Segue em anexo seu Extrato de Pagamentos. Favor conferir e nos retornar em caso de dúvidas.");
            return ResponseEntity.ok(Map.of("mensagem", "Extrato enviado para o WhatsApp com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao disparar WhatsApp: " + e.getMessage()));
        }
    }

    private ConfiguracaoSistema obterConfiguracaoAtual() {
        return configuracaoAtualService.obterAtual();
    }
}
