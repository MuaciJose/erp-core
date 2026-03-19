package com.grandport.erp.modules.os.controller;

import com.grandport.erp.modules.os.dto.OsRequestDTO;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.service.OrdemServicoService;
import com.grandport.erp.modules.os.service.OsFiscalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/os")
public class OrdemServicoController {

    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private OrdemServicoService osService;
    @Autowired private OsFiscalService osFiscalService;

    @Autowired private com.grandport.erp.modules.pdf.service.PdfService pdfService;
    @Autowired private com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository configuracaoRepository;

    @GetMapping
    public List<OrdemServico> listarTodas() {
        return osRepository.findAll();
    }

    @GetMapping("/{id}")
    public OrdemServico buscarPorId(@PathVariable Long id) {
        return osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
    }

    @PostMapping
    public OrdemServico criarNovaOS(@RequestBody OsRequestDTO dto) {
        return osService.salvarRascunho(dto, null); // 🚀 Passa pelo motor com Auditoria
    }

    @PutMapping("/{id}")
    public OrdemServico atualizarOS(@PathVariable Long id, @RequestBody OsRequestDTO dto) {
        return osService.salvarRascunho(dto, id); // 🚀 Passa pelo motor com Auditoria
    }

    @PatchMapping("/{id}/status")
    public OrdemServico mudarStatus(@PathVariable Long id, @RequestParam String status) {
        OrdemServico os = osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.valueOf(status));
        return osRepository.save(os);
    }

    // Rota que o Gerente usa na tela de OS (Aguardando Pagamento)
    @PostMapping("/{id}/enviar-caixa")
    public OrdemServico enviarParaCaixa(@PathVariable Long id) {
        OrdemServico os = osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));

        // 🚀 Removemos a baixa de estoque daqui para não duplicar,
        // pois a baixa real e a auditoria ocorrem no momento do faturamento final (Caixa).
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.AGUARDANDO_PAGAMENTO);
        return osRepository.save(os);
    }

    // Rota que o Operador de Caixa usa
    @PostMapping("/{id}/pagar")
    public OrdemServico pagarOS(@PathVariable Long id, @RequestBody java.util.List<java.util.Map<String, Object>> pagamentosRequest) {
        // 🚀 Passa os pagamentos para o motor para gravar o financeiro antes de faturar
        return osService.faturarOSPagamento(id, pagamentosRequest);
    }

    // ==========================================
    // 🚀 MÓDULO FISCAL (CHAVE SELETORA: 55 OU 65)
    // ==========================================

    @PostMapping("/{id}/fiscal/emitir-pecas")
    public org.springframework.http.ResponseEntity<?> emitirNfePecas(
            @PathVariable Long id,
            @RequestParam(defaultValue = "55") String modelo) { // 🚀 CHAVE SELETORA AQUI!
        try {
            // O React vai enviar o modelo via URL: /api/os/1/fiscal/emitir-pecas?modelo=65
            return org.springframework.http.ResponseEntity.ok(osFiscalService.emitirFiscalPecas(id, modelo));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/fiscal/nfse-servicos")
    public org.springframework.http.ResponseEntity<?> emitirNfseServicos(@PathVariable Long id) {
        try {
            return org.springframework.http.ResponseEntity.ok(osFiscalService.emitirNfseServicos(id));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    // =========================================================
    // 🚀 ROTA DE IMPRESSÃO PROFISSIONAL (HTML PARA PDF)
    // =========================================================
    @GetMapping("/{id}/imprimir-pdf")
    public org.springframework.http.ResponseEntity<byte[]> imprimirOsPdf(@PathVariable Long id) {
        // 1. Puxa a OS e a Empresa do Banco
        OrdemServico os = osRepository.findById(id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
        var empresa = configuracaoRepository.findById(1L).orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // 2. Monta o nome do carro bonitinho
        String veiculoNome = "Não informado";
        if (os.getVeiculo() != null) {
            veiculoNome = os.getVeiculo().getMarca() + " " + os.getVeiculo().getModelo() + " - Placa: " + os.getVeiculo().getPlaca();
        }

        // 3. Prepara a maleta de variáveis para entregar pro HTML
        java.util.Map<String, Object> variaveis = new java.util.HashMap<>();
        variaveis.put("os", os);
        variaveis.put("empresa", empresa);
        variaveis.put("veiculoNome", veiculoNome);

        // 4. Manda o serviço gerar o PDF (COM PLANO B CASO O BANCO ESTEJA VAZIO) 🚀
        String htmlDoBanco = empresa.getLayoutHtmlOs();

        // 🚀 O PLANO DE CONTINGÊNCIA AQUI:
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/></head><body><h1>Ordem de Serviço #<span th:text=\"${os.id}\"></span></h1><p>Vá em configurações para definir seu layout!</p></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        // 5. Devolve o arquivo blindado
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=OS-" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}