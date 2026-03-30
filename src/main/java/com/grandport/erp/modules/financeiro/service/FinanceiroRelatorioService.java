package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.pdf.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceiroRelatorioService {

    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ContaPagarRepository contaPagarRepository;
    private final ContaReceberRepository contaReceberRepository;
    private final ConfiguracaoAtualService configuracaoAtualService;
    private final EmpresaContextService empresaContextService;
    private final PdfService pdfService;

    public byte[] gerarPdfRelatorioPagar(String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        List<ContaPagar> contasFiltradas = contaPagarRepository
                .findByEmpresaIdOrderByDataVencimentoAsc(empresaContextService.getRequiredEmpresaId())
                .stream()
                .filter(c -> filtrarContaPagar(c, busca, dataInicio, dataFim, status, tipoDataFiltro))
                .collect(Collectors.toList());

        double totalGeral = contasFiltradas.stream()
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();

        String tituloDinamico = "Relatorio de Contas a Pagar (Geral)";
        if ("PAGAS".equals(status)) {
            tituloDinamico = "Relatorio de Contas Pagas (Liquidadas)";
        } else if ("PENDENTES".equals(status)) {
            tituloDinamico = "Relatorio de Contas a Pagar (Pendentes)";
        }

        var empresa = configuracaoAtualService.obterAtual();
        List<Map<String, Object>> contas = contasFiltradas.stream()
                .map(c -> montarContaPagar(c, tipoDataFiltro))
                .collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", contas);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasPagar();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><body><h2 th:text=\"${tituloRelatorio}\">Relatório</h2><p>Total: R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></p><table><tr><th>Fornecedor</th><th>Data</th><th>Status</th><th>Valor</th></tr><tr th:each=\"c : ${contas}\"><td th:text=\"${c.fornecedorNome}\"></td><td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td></tr></table></body></html>";
        }
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    public byte[] gerarPdfRelatorioReceber(String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        List<ContaReceber> contasFiltradas = contaReceberRepository
                .findByEmpresaIdOrderByDataVencimentoAsc(empresaContextService.getRequiredEmpresaId())
                .stream()
                .filter(c -> filtrarContaReceber(c, busca, dataInicio, dataFim, status, tipoDataFiltro))
                .collect(Collectors.toList());

        double totalGeral = contasFiltradas.stream()
                .mapToDouble(c -> c.getValorOriginal() != null ? c.getValorOriginal().doubleValue() : 0.0)
                .sum();

        String tituloDinamico = "Relatorio de Contas a Receber (Geral)";
        if ("PAGAS".equals(status)) {
            tituloDinamico = "Relatorio de Contas Recebidas";
        } else if ("PENDENTES".equals(status)) {
            tituloDinamico = "Relatorio de Contas a Receber (Pendentes)";
        }

        var empresa = configuracaoAtualService.obterAtual();
        List<Map<String, Object>> contas = contasFiltradas.stream()
                .map(c -> montarContaReceber(c, tipoDataFiltro))
                .collect(Collectors.toList());

        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("contas", contas);
        variaveis.put("totalGeral", totalGeral);
        variaveis.put("dataEmissao", LocalDateTime.now().format(DATA_HORA_FORMATTER));
        variaveis.put("tituloRelatorio", tituloDinamico);

        String htmlDoBanco = empresa.getLayoutHtmlRelatorioContasReceber();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html><body><h2 th:text=\"${tituloRelatorio}\">Relatório</h2><p>Total: R$ <span th:text=\"${#numbers.formatDecimal(totalGeral, 1, 'POINT', 2, 'COMMA')}\"></span></p><table><tr><th>Cliente</th><th>Data</th><th>Status</th><th>Valor</th></tr><tr th:each=\"c : ${contas}\"><td th:text=\"${c.fornecedorNome}\"></td><td th:text=\"${c.dataVencimento}\"></td><td th:text=\"${c.status}\"></td><td th:text=\"${#numbers.formatDecimal(c.valor, 1, 'POINT', 2, 'COMMA')}\"></td></tr></table></body></html>";
        }
        return pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);
    }

    private boolean filtrarContaPagar(ContaPagar conta, String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        boolean matchBusca = true;
        if (!busca.isEmpty()) {
            String termo = busca.toLowerCase();
            String fornecedor = conta.getParceiro() != null && conta.getParceiro().getNome() != null
                    ? conta.getParceiro().getNome().toLowerCase()
                    : "";
            String descricao = conta.getDescricao() != null ? conta.getDescricao().toLowerCase() : "";
            matchBusca = fornecedor.contains(termo) || descricao.contains(termo);
        }

        String dataCurta = obterDataCurta(tipoDataFiltro, conta.getDataPagamento(), conta.getDataVencimento());
        boolean matchInicio = dataInicio.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0);
        boolean matchFim = dataFim.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0);

        String statusConta = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        boolean matchStatus = true;
        if ("PAGAS".equals(status)) {
            matchStatus = statusConta.contains("PAG") || statusConta.contains("LIQUID");
        } else if ("PENDENTES".equals(status)) {
            matchStatus = !statusConta.contains("PAG") && !statusConta.contains("LIQUID");
        }

        return matchBusca && matchInicio && matchFim && matchStatus;
    }

    private boolean filtrarContaReceber(ContaReceber conta, String busca, String dataInicio, String dataFim, String status, String tipoDataFiltro) {
        boolean matchBusca = true;
        if (!busca.isEmpty()) {
            String termo = busca.toLowerCase();
            String cliente = conta.getParceiro() != null && conta.getParceiro().getNome() != null
                    ? conta.getParceiro().getNome().toLowerCase()
                    : "";
            String descricao = conta.getDescricao() != null ? conta.getDescricao().toLowerCase() : "";
            matchBusca = cliente.contains(termo) || descricao.contains(termo);
        }

        String dataCurta = obterDataCurta(tipoDataFiltro, conta.getDataPagamento(), conta.getDataVencimento());
        boolean matchInicio = dataInicio.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataInicio) >= 0);
        boolean matchFim = dataFim.isEmpty() || (!dataCurta.isEmpty() && dataCurta.compareTo(dataFim) <= 0);

        String statusConta = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        boolean matchStatus = true;
        if ("PAGAS".equals(status)) {
            matchStatus = statusConta.contains("PAG") || statusConta.contains("LIQUID");
        } else if ("PENDENTES".equals(status)) {
            matchStatus = !statusConta.contains("PAG") && !statusConta.contains("LIQUID");
        }

        return matchBusca && matchInicio && matchFim && matchStatus;
    }

    private String obterDataCurta(String tipoDataFiltro, LocalDateTime dataPagamento, LocalDateTime dataVencimento) {
        String dataAlvo = "";
        if ("PAGAMENTO".equals(tipoDataFiltro) && dataPagamento != null) {
            dataAlvo = dataPagamento.toString();
        } else if ("VENCIMENTO".equals(tipoDataFiltro) && dataVencimento != null) {
            dataAlvo = dataVencimento.toString();
        }
        return dataAlvo.length() >= 10 ? dataAlvo.substring(0, 10) : dataAlvo;
    }

    private Map<String, Object> montarContaPagar(ContaPagar conta, String tipoDataFiltro) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", conta.getId());
        map.put("fornecedorNome", conta.getParceiro() != null && conta.getParceiro().getNome() != null ? conta.getParceiro().getNome() : "Diversos");
        map.put("descricao", conta.getDescricao() != null ? conta.getDescricao() : "");
        map.put("dataVencimento", formatarData(tipoDataFiltro, conta.getDataPagamento(), conta.getDataVencimento()));
        map.put("valor", conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0);
        String status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        map.put("status", status.contains("PAG") || status.contains("LIQUID") ? "PAGO" : "PENDENTE");
        return map;
    }

    private Map<String, Object> montarContaReceber(ContaReceber conta, String tipoDataFiltro) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", conta.getId());
        map.put("fornecedorNome", conta.getParceiro() != null && conta.getParceiro().getNome() != null ? conta.getParceiro().getNome() : "Consumidor");
        map.put("descricao", conta.getDescricao() != null ? conta.getDescricao() : "");
        map.put("dataVencimento", formatarData(tipoDataFiltro, conta.getDataPagamento(), conta.getDataVencimento()));
        map.put("valor", conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0);
        String status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
        map.put("status", status.contains("PAG") || status.contains("LIQUID") ? "RECEBIDO" : "PENDENTE");
        return map;
    }

    private String formatarData(String tipoDataFiltro, LocalDateTime dataPagamento, LocalDateTime dataVencimento) {
        if ("PAGAMENTO".equals(tipoDataFiltro) && dataPagamento != null) {
            return DATA_FORMATTER.format(dataPagamento);
        }
        if (dataVencimento != null) {
            return DATA_FORMATTER.format(dataVencimento);
        }
        return "-";
    }
}
