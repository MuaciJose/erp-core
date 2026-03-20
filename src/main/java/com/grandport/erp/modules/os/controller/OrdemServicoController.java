package com.grandport.erp.modules.os.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.os.dto.OsRequestDTO;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.service.OrdemServicoService;
import com.grandport.erp.modules.os.service.OsFiscalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
// 🚀 ROTA DE IMPRESSÃO PROFISSIONAL (ORDEM DE SERVIÇO)
// =========================================================
    @GetMapping("/{id}/imprimir-pdf")
    public org.springframework.http.ResponseEntity<byte[]> imprimirOsPdf(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "true") boolean imprimirLaudo // 🚀 RECEBE SE A CAIXINHA TÁ MARCADA
    ) {

        // 1. Puxa a OS e a Empresa do Banco
        OrdemServico os = osRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        var empresa = configuracaoRepository.findById(1L)
                .orElse(new com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema());

        // 🔥 Número formatado
        String numeroOsFormatado = String.format("OS-%06d", os.getId());

        // 2. Pré-processamento de dados
        String nomeCliente = (os.getCliente() != null && os.getCliente().getNome() != null)
                ? os.getCliente().getNome()
                : "CONSUMIDOR FINAL";

        String telefoneCliente = (os.getCliente() != null && os.getCliente().getTelefone() != null)
                ? os.getCliente().getTelefone()
                : "--";

        // 🚀 INTELIGÊNCIA DO CONSULTOR / EXECUTANTE
        String nomeConsultor = "Padrão";
        if (os.getConsultor() != null) {
            nomeConsultor = (os.getConsultor().getNomeCompleto() != null && !os.getConsultor().getNomeCompleto().trim().isEmpty())
                    ? os.getConsultor().getNomeCompleto()
                    : os.getConsultor().getUsername();
        } else if (os.getItensServicos() != null && !os.getItensServicos().isEmpty()) {
            // Se não tem consultor, pega o nome do MECÂNICO (Executante) do primeiro serviço!
            var primeiroMecanico = os.getItensServicos().get(0).getMecanico();
            if (primeiroMecanico != null) {
                nomeConsultor = (primeiroMecanico.getNomeCompleto() != null && !primeiroMecanico.getNomeCompleto().trim().isEmpty())
                        ? primeiroMecanico.getNomeCompleto()
                        : primeiroMecanico.getUsername();
            }
        }

        // 3. Veículo
        String veiculoNome = "Não informado";
        String placaVeiculo = "--";

        if (os.getVeiculo() != null) {
            veiculoNome =
                    (os.getVeiculo().getMarca() != null ? os.getVeiculo().getMarca() : "") + " " +
                            (os.getVeiculo().getModelo() != null ? os.getVeiculo().getModelo() : "");

            placaVeiculo = os.getVeiculo().getPlaca() != null
                    ? os.getVeiculo().getPlaca()
                    : "--";
        }

        // ✅ ÚNICA declaração do mapa
        java.util.Map<String, Object> variaveis = new java.util.HashMap<>();

        // 4. Variáveis para o Thymeleaf
        variaveis.put("os", os);
        variaveis.put("empresa", empresa);
        variaveis.put("numeroOs", numeroOsFormatado);
        variaveis.put("nomeCliente", nomeCliente);
        variaveis.put("telefoneCliente", telefoneCliente);
        variaveis.put("nomeConsultor", nomeConsultor);
        variaveis.put("veiculoNome", veiculoNome.trim());
        variaveis.put("placaVeiculo", placaVeiculo);

        // 🚀 INJETA A DECISÃO DO LAUDO PARA O HTML
        variaveis.put("imprimirLaudo", imprimirLaudo);


        // 5. Layout
        String htmlDoBanco = empresa.getLayoutHtmlOs();

        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><head><meta charset=\"UTF-8\"/></head><body><h1>Ordem de Serviço <span th:text=\"${numeroOs}\"></span></h1><p>Vá em configurações para definir seu layout!</p></body></html>";
        }

        // 6. Geração do PDF
        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        // 7. Retorno
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=OS-" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(arquivoPdf);

    }

}