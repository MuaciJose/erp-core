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

        // 1. Pega o último registro da tabela (Acessando direto a Entidade)
        var ultimoCaixa = caixaRepository.findTopByOrderByIdDesc().orElse(null);
        if (ultimoCaixa == null) return ResponseEntity.badRequest().build();

        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // 2. Cálculos usando os nomes EXATOS da sua classe CaixaDiario.java
        double totalDinheiro = ultimoCaixa.getTotalDinheiro() != null ? ultimoCaixa.getTotalDinheiro().doubleValue() : 0;
        double totalCartao = ultimoCaixa.getTotalCartao() != null ? ultimoCaixa.getTotalCartao().doubleValue() : 0;
        double totalPix = ultimoCaixa.getTotalPix() != null ? ultimoCaixa.getTotalPix().doubleValue() : 0;
        double totalSangrias = ultimoCaixa.getTotalSangrias() != null ? ultimoCaixa.getTotalSangrias().doubleValue() : 0;
        double saldoInicial = ultimoCaixa.getSaldoInicial() != null ? ultimoCaixa.getSaldoInicial().doubleValue() : 0;

        double totalEntradas = totalDinheiro + totalCartao + totalPix;
        // Saldo esperado em gaveta = Troco inicial + Entradas em Dinheiro - Retiradas (Sangrias)
        double saldoEsperado = saldoInicial + totalDinheiro - totalSangrias;

        double valorInformado = ultimoCaixa.getValorInformadoFechamento() != null ? ultimoCaixa.getValorInformadoFechamento().doubleValue() : 0;
        double diferenca = valorInformado - saldoEsperado;

        // 🚀 PUXA O NOME QUE SALVAMOS NO PASSO 2
        String nomeOperador = (ultimoCaixa.getOperadorNome() != null && !ultimoCaixa.getOperadorNome().isEmpty())
                ? ultimoCaixa.getOperadorNome()
                : "Administrador";

        // 3. Monta a maleta de variáveis pro HTML
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("empresa", empresa);
        variaveis.put("caixa", ultimoCaixa);
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
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Caixa.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}
