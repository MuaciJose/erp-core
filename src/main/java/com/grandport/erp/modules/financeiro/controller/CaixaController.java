package com.grandport.erp.modules.financeiro.controller;

import com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
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
    private ConfiguracaoAtualService configuracaoAtualService;

    @Autowired
    private com.grandport.erp.modules.financeiro.repository.CaixaDiarioRepository caixaRepository;

    // 🚀 NOVA ROTA: LISTAR HISTÓRICO BLINDADO E COM OPERADOR
    @GetMapping
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> listarTodos() {
        java.util.List<java.util.Map<String, Object>> lista = caixaRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"))
                .stream()
                .map(c -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", c.getId());
                    map.put("dataAbertura", c.getDataAbertura());
                    map.put("dataFechamento", c.getDataFechamento());
                    map.put("status", c.getStatus() != null ? c.getStatus().name() : "DESCONHECIDO");
                    // 🚀 Mandando o nome do operador pro React conseguir pesquisar!
                    map.put("operadorNome", c.getOperadorNome() != null && !c.getOperadorNome().isEmpty() ? c.getOperadorNome() : "Administrador");
                    return map;
                })
                .toList();
        return ResponseEntity.ok(lista);
    }

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

    // 🚀 ROTA BLINDADA E ATUALIZADA: IMPRIME O CAIXA ATUAL OU UM ESPECÍFICO PELO ID
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> imprimirRelatorioCaixaPdf(@RequestParam(required = false) Long id) {

        // 1. Pega o caixa pelo ID (se o React mandar) ou pega o último por padrão
        com.grandport.erp.modules.financeiro.model.CaixaDiario caixaSelecionado;

        if (id != null) {
            caixaSelecionado = caixaRepository.findById(id).orElse(null);
        } else {
            caixaSelecionado = caixaRepository.findTopByOrderByIdDesc().orElse(null);
        }

        if (caixaSelecionado == null) return ResponseEntity.badRequest().build();

        var empresa = obterConfiguracaoAtual();

        // 2. Cálculos usando os nomes EXATOS da sua classe CaixaDiario.java
        double totalDinheiro = caixaSelecionado.getTotalDinheiro() != null ? caixaSelecionado.getTotalDinheiro().doubleValue() : 0;
        double totalCartao = caixaSelecionado.getTotalCartao() != null ? caixaSelecionado.getTotalCartao().doubleValue() : 0;
        double totalPix = caixaSelecionado.getTotalPix() != null ? caixaSelecionado.getTotalPix().doubleValue() : 0;
        double totalSangrias = caixaSelecionado.getTotalSangrias() != null ? caixaSelecionado.getTotalSangrias().doubleValue() : 0;
        double saldoInicial = caixaSelecionado.getSaldoInicial() != null ? caixaSelecionado.getSaldoInicial().doubleValue() : 0;

        double totalEntradas = totalDinheiro + totalCartao + totalPix;
        // Saldo esperado em gaveta = Troco inicial + Entradas em Dinheiro - Retiradas (Sangrias)
        double saldoEsperado = saldoInicial + totalDinheiro - totalSangrias;

        double valorInformado = caixaSelecionado.getValorInformadoFechamento() != null ? caixaSelecionado.getValorInformadoFechamento().doubleValue() : 0;
        double diferenca = valorInformado - saldoEsperado;

        // 🚀 PUXA O NOME DO OPERADOR
        String nomeOperador = (caixaSelecionado.getOperadorNome() != null && !caixaSelecionado.getOperadorNome().isEmpty())
                ? caixaSelecionado.getOperadorNome()
                : "Administrador";

        // 3. Monta a maleta de variáveis pro HTML
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("caixa", caixaSelecionado);
        variaveis.put("dataEmissao", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        // 🚀 Injetando as variáveis mastigadas para o cupom
        variaveis.put("operadorNome", nomeOperador);
        variaveis.put("totalEntradas", totalEntradas);
        variaveis.put("totalSaidas", totalSangrias);
        variaveis.put("saldoFinalCalculado", saldoEsperado);
        variaveis.put("valorInformado", valorInformado);
        variaveis.put("diferenca", diferenca);

        // 4. Puxa o HTML do banco
        String htmlDoBanco = empresa.getLayoutHtmlFechamentoCaixa();

        // Fallback básico caso o layout no banco dê problema
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><body><h2>Layout nao encontrado</h2></body></html>";
        }

        // 5. Gera o PDF final
        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Caixa_" + caixaSelecionado.getId() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }

    private com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema obterConfiguracaoAtual() {
        return configuracaoAtualService.obterAtual();
    }
}
