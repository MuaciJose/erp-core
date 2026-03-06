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

    // Garanta que este nome seja exatamente o mesmo que você criou no Insomnia/Docker
    private final String INSTANCIA = "GrandPort";

    /**
     * Envia o PDF da venda via WhatsApp no padrão Evolution API v2.x
     */
    public void enviarReciboPdfPorWhatsApp(Long vendaId) {

        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String token = config.getWhatsappToken();
        String apiUrl = config.getWhatsappApiUrl();

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

        // Limpeza do número
        String telefoneDestino = venda.getCliente().getTelefone().replaceAll("\\D", "");
        if (!telefoneDestino.startsWith("55")) {
            telefoneDestino = "55" + telefoneDestino;
        }

        // Geração do PDF
        byte[] pdfBytes = relatorioService.gerarPdfVenda(vendaId);
        String pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes);

        // 🚀 AJUSTE PARA V2.x: O endpoint e a estrutura do payload mudaram
        String urlEnvio = apiUrl + "/message/sendMedia/" + INSTANCIA;

        // Na V2, os campos de mídia são enviados no primeiro nível do JSON
        Map<String, Object> payload = new HashMap<>();
        payload.put("number", telefoneDestino);
        payload.put("mediatype", "document"); // document, image, video, audio
        payload.put("media", pdfBase64);
        payload.put("fileName", "Recibo_Venda_" + venda.getId() + ".pdf");
        payload.put("caption", "Olá! Segue em anexo o recibo da sua compra na *" + config.getNomeFantasia() + "*.");
        payload.put("delay", 1200); // Atraso em milissegundos

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", token);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(urlEnvio, request, String.class);
            System.out.println("WhatsApp enviado com sucesso! Resposta: " + response.getBody());
        } catch (HttpClientErrorException e) {
            // 🚀 CAPTURA O ERRO REAL: Imprime o que a API do WhatsApp respondeu (Ex: Instância desconectada)
            String erroApi = e.getResponseBodyAsString();
            System.err.println("Erro 400 da Evolution API: " + erroApi);
            throw new RuntimeException("O motor do WhatsApp recusou o envio: " + erroApi);
        } catch (Exception e) {
            System.err.println("Erro geral no envio: " + e.getMessage());
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

        if (token == null || token.isEmpty()) throw new RuntimeException("Token não configurado.");
        if (url == null || url.isEmpty()) url = "http://localhost:8081";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

        String endpoint = url + "/instance/connect/" + INSTANCIA;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", token);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    org.springframework.http.HttpMethod.GET,
                    request,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Erro ao buscar QR Code: " + e.getMessage());
            throw new RuntimeException("Erro ao conectar ao motor do WhatsApp.");
        }
    }

    public Map<String, Object> consultarStatusInstancia() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String url = config.getWhatsappApiUrl();
        String token = config.getWhatsappToken();

        if (url == null || url.isEmpty()) url = "http://localhost:8081";
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

        // Endpoint específico da Evolution para ver o estado da conexão
        String endpoint = url + "/instance/connectionState/" + INSTANCIA;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", token);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            // Se der erro, retornamos que está desconectado
            Map<String, Object> erro = new HashMap<>();
            erro.put("instance", Map.of("state", "DISCONNECTED"));
            return erro;
        }
    }
}