package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.pdf.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceiroDocumentoService {

    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ConfiguracaoAtualService configuracaoAtualService;
    private final EmpresaContextService empresaContextService;
    private final ContaPagarRepository contaPagarRepository;
    private final ContaReceberRepository contaReceberRepository;
    private final ParceiroRepository parceiroRepository;
    private final PdfService pdfService;

    public byte[] gerarReciboPagamento(Long contaId) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        var conta = contaPagarRepository.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta não encontrada."));
        var empresa = configuracaoAtualService.obterAtual();

        String nomeFornecedor = conta.getParceiro() != null && conta.getParceiro().getNome() != null
                ? conta.getParceiro().getNome()
                : "Diversos";
        double valorConta = conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("conta", conta);
        variaveis.put("fornecedorNome", nomeFornecedor);
        variaveis.put("valorConta", valorConta);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));

        String htmlDoBanco = empresa.getLayoutHtmlReciboPagamento();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><style>body{font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px;}</style></head><body><h2 style='text-align:center;'>RECIBO DE PAGAMENTO</h2><hr/><b>Fornecedor:</b> <span th:text=\"${fornecedorNome}\"></span><br/><b>Descricao:</b> <span th:text=\"${conta.descricao}\"></span><br/><b>Valor Pago:</b> R$ <span th:text=\"${#numbers.formatDecimal(valorConta, 1, 'POINT', 2, 'COMMA')}\"></span><br/><hr/><p style='text-align:center; font-size:10px;'>Emitido em: <span th:text=\"${dataEmissao}\"></span></p></body></html>";
        }

        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    public byte[] gerarReciboRecebimento(Long contaId) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        var conta = contaReceberRepository.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta não encontrada."));
        var empresa = configuracaoAtualService.obterAtual();

        String nomeCliente = conta.getParceiro() != null && conta.getParceiro().getNome() != null
                ? conta.getParceiro().getNome()
                : "Consumidor Final";
        double valorConta = conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0;

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("conta", conta);
        variaveis.put("clienteNome", nomeCliente);
        variaveis.put("valorConta", valorConta);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));

        String htmlDoBanco = empresa.getLayoutHtmlRecibo();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><head><style>body{font-family: sans-serif; font-size: 14px; margin: 20px;}</style></head><body><h2 style='text-align:center;'>RECIBO DE RECEBIMENTO</h2><hr/><b>Recebemos de:</b> <span th:text=\"${clienteNome}\"></span><br/><b>Referente a:</b> <span th:text=\"${conta.descricao}\"></span><br/><b>Valor:</b> R$ <span th:text=\"${#numbers.formatDecimal(valorConta, 1, 'POINT', 2, 'COMMA')}\"></span><br/><hr/><p style='text-align:center; font-size:10px;'>Emitido em: <span th:text=\"${dataEmissao}\"></span></p></body></html>";
        }

        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    public byte[] gerarExtratoCliente(Long parceiroId, String dataInicio, String dataFim) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Parceiro parceiro = parceiroRepository.findByEmpresaIdAndId(empresaId, parceiroId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));

        List<ContaReceber> contasFiltradas = contaReceberRepository
                .findByEmpresaIdAndParceiroIdOrderByDataVencimentoAsc(empresaId, parceiroId)
                .stream()
                .filter(c -> correspondeAoPeriodo(c.getDataVencimento(), dataInicio, dataFim))
                .collect(Collectors.toList());

        double totalPendente = contasFiltradas.stream()
                .filter(c -> !isLiquidada(c.getStatus() != null ? c.getStatus().toString() : "PENDENTE"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();
        double totalRecebido = contasFiltradas.stream()
                .filter(c -> isLiquidada(c.getStatus() != null ? c.getStatus().toString() : "PENDENTE"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();

        var empresa = configuracaoAtualService.obterAtual();
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("parceiro", parceiro);
        variaveis.put("contas", contasFiltradas.stream().map(this::montarContaReceberExtrato).collect(Collectors.toList()));
        variaveis.put("totalPendente", totalPendente);
        variaveis.put("totalRecebido", totalRecebido);
        variaveis.put("totalGeral", totalPendente + totalRecebido);
        variaveis.put("dataInicio", dataInicio);
        variaveis.put("dataFim", dataFim);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));

        String htmlDoBanco = empresa.getLayoutHtmlExtratoCliente();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = gerarTemplateExtratoClientePadrao();
        }

        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    public byte[] gerarExtratoFornecedor(Long parceiroId, String dataInicio, String dataFim) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Parceiro parceiro = parceiroRepository.findByEmpresaIdAndId(empresaId, parceiroId)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado."));

        List<ContaPagar> contasFiltradas = contaPagarRepository
                .findByEmpresaIdAndParceiroIdOrderByDataVencimentoAsc(empresaId, parceiroId)
                .stream()
                .filter(c -> correspondeAoPeriodo(c.getDataVencimento(), dataInicio, dataFim))
                .collect(Collectors.toList());

        double totalPendente = contasFiltradas.stream()
                .filter(c -> !isLiquidada(c.getStatus() != null ? c.getStatus().toString() : "PENDENTE"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();
        double totalPago = contasFiltradas.stream()
                .filter(c -> isLiquidada(c.getStatus() != null ? c.getStatus().toString() : "PENDENTE"))
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();

        var empresa = configuracaoAtualService.obterAtual();
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("parceiro", parceiro);
        variaveis.put("contas", contasFiltradas.stream().map(this::montarContaPagarExtrato).collect(Collectors.toList()));
        variaveis.put("totalPendente", totalPendente);
        variaveis.put("totalPago", totalPago);
        variaveis.put("totalGeral", totalPendente + totalPago);
        variaveis.put("dataInicio", dataInicio);
        variaveis.put("dataFim", dataFim);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));

        String htmlDoBanco = empresa.getLayoutHtmlExtratoFornecedor();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = gerarTemplateExtratoFornecedorPadrao();
        }

        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    private boolean correspondeAoPeriodo(LocalDateTime dataVencimento, String dataInicio, String dataFim) {
        if (dataVencimento == null) {
            return false;
        }
        String dataCurta = dataVencimento.toString().substring(0, 10);
        boolean matchInicio = dataInicio.isEmpty() || dataCurta.compareTo(dataInicio) >= 0;
        boolean matchFim = dataFim.isEmpty() || dataCurta.compareTo(dataFim) <= 0;
        return matchInicio && matchFim;
    }

    private boolean isLiquidada(String status) {
        return status.contains("PAG") || status.contains("LIQUID");
    }

    private Map<String, Object> montarContaReceberExtrato(ContaReceber conta) {
        Map<String, Object> map = new HashMap<>();
        String status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        map.put("id", conta.getId());
        map.put("descricao", conta.getDescricao() != null ? conta.getDescricao() : "-");
        map.put("dataVencimento", conta.getDataVencimento() != null ? DATA_FORMATTER.format(conta.getDataVencimento()) : "-");
        map.put("dataPagamento", conta.getDataPagamento() != null ? DATA_FORMATTER.format(conta.getDataPagamento()) : "-");
        map.put("valor", conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0);
        map.put("status", isLiquidada(status) ? "RECEBIDO" : "PENDENTE");
        map.put("diasAtraso", calcularDiasAtraso(conta.getDataVencimento(), status));
        return map;
    }

    private Map<String, Object> montarContaPagarExtrato(ContaPagar conta) {
        Map<String, Object> map = new HashMap<>();
        String status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        map.put("id", conta.getId());
        map.put("descricao", conta.getDescricao() != null ? conta.getDescricao() : "-");
        map.put("dataVencimento", conta.getDataVencimento() != null ? DATA_FORMATTER.format(conta.getDataVencimento()) : "-");
        map.put("dataPagamento", conta.getDataPagamento() != null ? DATA_FORMATTER.format(conta.getDataPagamento()) : "-");
        map.put("valor", conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0);
        map.put("status", isLiquidada(status) ? "PAGO" : "PENDENTE");
        map.put("diasAtraso", calcularDiasAtraso(conta.getDataVencimento(), status));
        return map;
    }

    private long calcularDiasAtraso(LocalDateTime dataVencimento, String status) {
        if (dataVencimento == null || !status.contains("PENDENTE")) {
            return 0;
        }
        long dias = ChronoUnit.DAYS.between(dataVencimento.toLocalDate(), LocalDate.now());
        return Math.max(dias, 0);
    }

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
