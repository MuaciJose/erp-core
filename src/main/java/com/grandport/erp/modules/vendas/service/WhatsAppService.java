package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private RelatorioService relatorioService;

    @Autowired
    private VendaRepository vendaRepository;

    // 🚀 CORRIGIDO: Removido o acento (til) que quebrava a URL da Evolution API
    private String getInstanciaConfigurada(ConfiguracaoSistema config) {
        String instancia = config.getWhatsappInstancia();
        if (instancia == null || instancia.trim().isEmpty()) {
            return "Padrao";
        }
        return instancia.trim();
    }

    /**
     * Envia o PDF da venda via WhatsApp no padrão Evolution API v2.x
     */
    public void enviarReciboPdfPorWhatsApp(Long vendaId) {

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String token = config.getWhatsappToken();
        String apiUrl = config.getWhatsappApiUrl();
        String instancia = getInstanciaConfigurada(config);

        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Token do WhatsApp não configurado.");
        }
        if (apiUrl == null || apiUrl.trim().isEmpty()) {
            apiUrl = "http://localhost:8081";
        }
        if (apiUrl.endsWith("/")) {
            apiUrl = apiUrl.substring(0, apiUrl.length() - 1);
        }

        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada!"));

        if (venda.getCliente() == null || venda.getCliente().getTelefone() == null) {
            throw new RuntimeException("Cliente sem telefone válido.");
        }

        String telefoneDestino = venda.getCliente().getTelefone().replaceAll("\\D", "");
        if (!telefoneDestino.startsWith("55")) {
            telefoneDestino = "55" + telefoneDestino;
        }

        byte[] pdfBytes = relatorioService.gerarPdfVenda(vendaId);
        String pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes);

        String urlEnvio = apiUrl + "/message/sendMedia/" + instancia;

        Map<String, Object> payload = new HashMap<>();
        payload.put("number", telefoneDestino);
        payload.put("mediatype", "document");

        // 🚀 CORREÇÃO DEFINITIVA (EVOLUTON V2): Passar o mimetype separado e a string Base64 limpa!
        payload.put("mimetype", "application/pdf");
        payload.put("media", pdfBase64);

        payload.put("fileName", "Recibo_Venda_" + venda.getId() + ".pdf");
        String textoZap = (config.getMensagemWhatsapp() != null && !config.getMensagemWhatsapp().trim().isEmpty())
                ? config.getMensagemWhatsapp()
                : "Olá! Segue em anexo o documento da sua compra na *" + config.getNomeFantasia() + "*.";

        payload.put("caption", textoZap);
        payload.put("delay", 1200);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", token);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(urlEnvio, request, String.class);
            System.out.println("WhatsApp enviado com sucesso! Resposta: " + response.getBody());
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("O motor do WhatsApp recusou o envio: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Falha na comunicação com o WhatsApp.");
        }
    }

    public void enviarArquivoPdfBase64(String telefoneDestino, String pdfBase64, String fileName, String caption) {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String token = config.getWhatsappToken();
        String apiUrl = config.getWhatsappApiUrl();
        String instancia = getInstanciaConfigurada(config);

        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Token não configurado.");
        }
        if (apiUrl == null || apiUrl.trim().isEmpty()) {
            apiUrl = "http://localhost:8081";
        }
        if (apiUrl.endsWith("/")) {
            apiUrl = apiUrl.substring(0, apiUrl.length() - 1);
        }

        telefoneDestino = telefoneDestino.replaceAll("\\D", "");
        if (!telefoneDestino.startsWith("55")) {
            telefoneDestino = "55" + telefoneDestino;
        }

        String urlEnvio = apiUrl + "/message/sendMedia/" + instancia;

        Map<String, Object> payload = new HashMap<>();
        payload.put("number", telefoneDestino);
        payload.put("mediatype", "document");

        // 🚀 CORREÇÃO DEFINITIVA 2 (EVOLUTON V2): Mimetype separado e Base64 limpo!
        payload.put("media", "data:application/pdf;base64," + pdfBase64);
        payload.put("media", pdfBase64);

        payload.put("fileName", fileName);
        payload.put("caption", caption);
        payload.put("delay", 1200);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", token);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(urlEnvio, request, String.class);
            System.out.println("WhatsApp Curinga enviado: " + response.getBody());
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("O motor do WhatsApp recusou o envio: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Falha na comunicação com o WhatsApp.");
        }
    }

    /**
     * Solicita o QR Code para o Frontend
     */
    public Map<String, Object> solicitarQrCodeConexao() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String url = config.getWhatsappApiUrl();
        String token = config.getWhatsappToken();
        String instancia = getInstanciaConfigurada(config);

        if (token == null || token.isEmpty()) throw new RuntimeException("Token não configurado.");
        if (url == null || url.isEmpty()) url = "http://localhost:8081";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

        String endpoint = url + "/instance/connect/" + instancia;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", token);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    endpoint,
                    org.springframework.http.HttpMethod.GET,
                    request,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            System.err.println("❌ ERRO DA EVOLUTION (QR CODE): " + e.getResponseBodyAsString());
            throw new RuntimeException("Erro da API: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("❌ ERRO GERAL (QR CODE): " + e.getMessage());
            throw new RuntimeException("Erro ao conectar ao motor do WhatsApp.");
        }
    }

    public Map<String, Object> consultarStatusInstancia() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String url = config.getWhatsappApiUrl();
        String token = config.getWhatsappToken();
        String instancia = getInstanciaConfigurada(config);

        if (url == null || url.isEmpty()) url = "http://localhost:8081";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

        String endpoint = url + "/instance/connectionState/" + instancia;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", token);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    endpoint,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> erro = new HashMap<>();
            erro.put("instance", Map.of("state", "DISCONNECTED"));
            return erro;
        }
    }

    public void desconectarInstancia() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String url = config.getWhatsappApiUrl();
        String token = config.getWhatsappToken();
        String instancia = getInstanciaConfigurada(config);

        if (url == null || url.isEmpty()) url = "http://localhost:8081";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

        String endpoint = url + "/instance/logout/" + instancia;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", token);

        restTemplate.exchange(
                endpoint,
                org.springframework.http.HttpMethod.DELETE,
                new HttpEntity<>(headers),
                String.class
        );
    }
}