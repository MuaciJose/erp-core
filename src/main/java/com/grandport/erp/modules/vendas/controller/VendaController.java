package com.grandport.erp.modules.vendas.controller;

import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.service.VendaService;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.vendas.service.WhatsAppService;
import com.grandport.erp.modules.fiscal.service.NfeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    @Autowired private VendaService service;
    @Autowired private VendaRepository repository;
    @Autowired private WhatsAppService whatsAppService;
    @Autowired private NfeService nfeService;
    @Autowired private com.grandport.erp.modules.pdf.service.PdfService pdfService;
    @Autowired private ConfiguracaoAtualService configuracaoAtualService;

    // =========================================================================
    // 🛡️ ROTAS LISTAGEM AGORA PROTEGIDAS PELO SERVICE
    // =========================================================================
    @GetMapping
    public ResponseEntity<List<Venda>> listarTodas() {
        return ResponseEntity.ok(service.listarTodasAsVendas());
    }

    @GetMapping("/orcamentos")
    public ResponseEntity<List<Venda>> listarOrcamentos() {
        return ResponseEntity.ok(service.listarOrcamentos());
    }

    @GetMapping("/fila-caixa")
    public ResponseEntity<List<Venda>> getFilaCaixa() {
        return ResponseEntity.ok(service.listarFilaCaixa());
    }

    // =========================================================================
    // ENDPOINTS ORIGINAIS MANTIDOS INTACTOS
    // =========================================================================
    @PostMapping("/{id}/enviar-whatsapp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> enviarReciboWhatsApp(@PathVariable Long id) {
        try {
            whatsAppService.enviarReciboPdfPorWhatsApp(id);
            return ResponseEntity.ok("{\"message\": \"Documento enviado com sucesso pelo WhatsApp!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/orcamento")
    public ResponseEntity<Venda> salvarOrcamento(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.salvarOrcamento(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Venda> atualizarVenda(@PathVariable Long id, @RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarVenda(id, dto));
    }

    @PostMapping("/pedido")
    public ResponseEntity<Venda> criarPedido(@RequestBody VendaRequestDTO dto) {
        return ResponseEntity.ok(service.criarPedido(dto));
    }

    @PostMapping("/{id}/pagar")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'CAIXA', 'VENDEDOR')")
    public ResponseEntity<?> finalizarPagamento(@PathVariable Long id, @RequestBody List<Map<String, Object>> payload) {
        try {
            // 🚀 O AMORTECEDOR À PROVA DE BALAS (Especial para Java Records)
            // Extraímos os dados manualmente ignorando os campos lixo do React (como cpfConsumidorFinal)
            List<PagamentoVendaDTO> pagamentos = payload.stream().map(mapa -> {
                String metodo = mapa.get("metodo") != null ? String.valueOf(mapa.get("metodo")) : "DINHEIRO";
                java.math.BigDecimal valor = mapa.get("valor") != null ? new java.math.BigDecimal(String.valueOf(mapa.get("valor"))) : java.math.BigDecimal.ZERO;
                Integer parcelas = mapa.get("parcelas") != null ? Integer.parseInt(String.valueOf(mapa.get("parcelas"))) : 1;

                return new PagamentoVendaDTO(metodo, valor, parcelas);
            }).toList();

            // Agora sim, os dados chegam 100% intactos no seu Service!
            Venda vendaPaga = service.finalizarPagamentoPedido(id, pagamentos);

            return ResponseEntity.ok(vendaPaga);

        } catch (Exception e) {
            // Míssil de erro direto para a tela vermelha do React!
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/devolver")
    public ResponseEntity<Venda> devolverAoVendedor(@PathVariable Long id) {
        return ResponseEntity.ok(service.devolverAoVendedor(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluirVenda(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/whatsapp/status")
    public ResponseEntity<Map<String, Object>> checarStatusWhatsApp() {
        return ResponseEntity.ok(whatsAppService.consultarStatusInstancia());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarVendaPorId(@PathVariable Long id) {
        try {
            Optional<Venda> venda = repository.findById(id);
            if (venda.isPresent()) {
                return ResponseEntity.ok(venda.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", "Venda não encontrada"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancelar-nfe")
    public ResponseEntity<?> cancelarNotaFiscal(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String justificativa = payload.get("justificativa");
        if (justificativa == null || justificativa.trim().length() < 15) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "A justificativa deve conter no mínimo 15 caracteres."));
        }
        try {
            nfeService.cancelarNfeDaVenda(id, justificativa);
            return ResponseEntity.ok(Map.of("message", "Nota Fiscal cancelada com sucesso na SEFAZ."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Rejeição SEFAZ: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/imprimir-pdf")
    public org.springframework.http.ResponseEntity<byte[]> imprimirVendaPdf(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "true") boolean imprimirObs
    ) {
        Venda venda = repository.findById(id).orElseThrow(() -> new RuntimeException("Venda não encontrada"));
        var empresa = configuracaoAtualService.obterAtual();

        boolean isOrcamento = venda.getStatus() != null && venda.getStatus().name().equals("ORCAMENTO");
        String nomeCliente = (venda.getCliente() != null && venda.getCliente().getNome() != null)
                ? venda.getCliente().getNome()
                : "CONSUMIDOR FINAL";
        String nomeVendedor = (venda.getVendedorNome() != null && !venda.getVendedorNome().isEmpty())
                ? venda.getVendedorNome()
                : "Padrão";

        java.util.Map<String, Object> variaveis = new java.util.HashMap<>();
        variaveis.put("venda", venda);
        variaveis.put("empresa", empresa);
        variaveis.put("isOrcamento", isOrcamento);
        variaveis.put("nomeCliente", nomeCliente);
        variaveis.put("nomeVendedor", nomeVendedor);
        variaveis.put("imprimirObs", imprimirObs);

        String htmlDoBanco = empresa.getLayoutHtmlVenda();
        if (htmlDoBanco == null || htmlDoBanco.trim().isEmpty()) {
            htmlDoBanco = "<!DOCTYPE html><html xmlns:th=\"http://www.thymeleaf.org\"><body><h1>Pedido de Venda #<span th:text=\"${venda.id}\"></span></h1><p>Vá em configurações para definir seu layout!</p></body></html>";
        }

        byte[] arquivoPdf = pdfService.gerarPdfDeStringHtml(htmlDoBanco, variaveis);

        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Documento-" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(arquivoPdf);
    }
}
