package com.grandport.erp.modules.os.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoAtualService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
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
    @Autowired private ConfiguracaoAtualService configuracaoAtualService;
    @Autowired private EmpresaContextService empresaContextService;

    // PARA: 🚀 (AQUI ESTÁ A BLINDAGEM)
    @GetMapping
    public List<OrdemServico> listarTodas() {
        return osService.listarTodasAsOs(); // A mágica da segurança ativada!
    }
    @GetMapping("/{id}")
    public OrdemServico buscarPorId(@PathVariable Long id) {
        return osRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
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
        OrdemServico os = osRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id).orElseThrow(() -> new RuntimeException("OS não encontrada"));
        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.valueOf(status));
        return osRepository.save(os);
    }

    // Rota que o Gerente usa na tela de OS (Aguardando Pagamento)
    @PostMapping("/{id}/enviar-caixa")
    public OrdemServico enviarParaCaixa(@PathVariable Long id) {
        OrdemServico os = osRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id).orElseThrow(() -> new RuntimeException("OS não encontrada"));

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
        OrdemServico os = osRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        var empresa = obterConfiguracaoAtual();

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
        variaveis.put("kmEntrada", os.getKmEntrada());
        variaveis.put("kmEntradaDisplay", os.getKmEntrada() != null ? os.getKmEntrada() + " km" : "--");

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

    // =========================================================
    // 🚀 ROTAS DE INTEGRAÇÃO FRONT-END (WHATSAPP E TÉRMICA)
    // =========================================================

    @PostMapping("/{id}/enviar-whatsapp")
    public org.springframework.http.ResponseEntity<?> enviarOsPorWhatsApp(@PathVariable Long id) {
        try {
            // 1. PUXAR A OS E A CONFIGURAÇÃO DO BANCO
            OrdemServico os = osRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id)
                    .orElseThrow(() -> new RuntimeException("OS não encontrada"));
            var config = obterConfiguracaoAtual();
            if (config.getId() == null) {
                throw new RuntimeException("Configuração do sistema não encontrada");
            }

            String token = config.getWhatsappToken();
            String apiUrl = config.getWhatsappApiUrl();
            String instancia = config.getWhatsappInstancia();

            if (token == null || instancia == null || token.trim().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "WhatsApp não está configurado no painel."));
            }

            if (os.getCliente() == null || os.getCliente().getTelefone() == null || os.getCliente().getTelefone().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "O cliente não possui um telefone válido cadastrado."));
            }

            // Formatar telefone (Colocar o 55 na frente se não tiver)
            String telefoneDestino = os.getCliente().getTelefone().replaceAll("\\D", "");
            if (!telefoneDestino.startsWith("55")) {
                telefoneDestino = "55" + telefoneDestino;
            }

            // 🚀 2. A MÁGICA: Pedir para a própria função do Controller fabricar o PDF!
            org.springframework.http.ResponseEntity<byte[]> responsePdf = imprimirOsPdf(id, true);
            byte[] pdfBytes = responsePdf.getBody();
            if (pdfBytes == null) throw new RuntimeException("Falha ao gerar o PDF da OS.");

            String pdfBase64 = java.util.Base64.getEncoder().encodeToString(pdfBytes);

            // 3. MONTAR A MENSAGEM DO WHATSAPP (Pegando do Painel)
            String nomeLoja = (config.getNomeFantasia() != null) ? config.getNomeFantasia() : "Nossa Oficina";
            String textoZap = (config.getMensagemWhatsapp() != null && !config.getMensagemWhatsapp().trim().isEmpty())
                    ? config.getMensagemWhatsapp()
                    : "Olá! Segue em anexo a sua Ordem de Serviço da *" + nomeLoja + "*.";

            // 4. PREPARAR O PACOTE DA EVOLUTION API V2
            if (apiUrl.endsWith("/")) apiUrl = apiUrl.substring(0, apiUrl.length() - 1);
            String urlEnvio = apiUrl + "/message/sendMedia/" + instancia;

            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("number", telefoneDestino);
            payload.put("mediatype", "document");
            payload.put("mimetype", "application/pdf");
            payload.put("media", pdfBase64);
            payload.put("fileName", "OS_" + os.getId() + ".pdf");
            payload.put("caption", textoZap);
            payload.put("delay", 1200);

            // 5. ENTREGAR A CAIXA PARA O MOTOR (RestTemplate)
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.set("apikey", token);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(payload, headers);

            org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(urlEnvio, request, String.class);

            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "OS enviada com sucesso pelo WhatsApp! ✅"));

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return org.springframework.http.ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", "O motor do WhatsApp recusou o envio. O celular está conectado?"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", "Erro interno ao enviar Zap: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/imprimir-html")
    public org.springframework.http.ResponseEntity<String> imprimirOsHtml(@PathVariable Long id) {
        try {

            // Para a impressora térmica funcionar, você precisa retornar aqui
            // o HTML processado com os dados da OS.
            // Se você já tiver um método que processa o Thymeleaf e devolve a String, chame-o aqui.

            String htmlProcessado = "<h1>O HTML da sua OS vai aparecer aqui!</h1>";

            return org.springframework.http.ResponseEntity.ok(htmlProcessado);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("Erro ao gerar HTML: " + e.getMessage());
        }
    }

    private ConfiguracaoSistema obterConfiguracaoAtual() {
        return configuracaoAtualService.obterAtual();
    }

}
