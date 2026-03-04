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
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    @Autowired
    private ConfiguracaoService configuracaoService;

    @Autowired
    private RelatorioService relatorioService; // O seu serviço que já gera o PDF da venda!

    @Autowired
    private VendaRepository vendaRepository;

    // URL da sua Evolution API (Geralmente roda na porta 8081)
    // Depois podemos colocar isso no banco de dados ou no application.properties
    private final String EVOLUTION_API_URL = "http://localhost:8081";
    private final String INSTANCIA = "GrandPort"; // O nome da instância que você criar lá

    public void enviarReciboPdfPorWhatsApp(Long vendaId) {

        // 1. Busca as configurações para pegar o Token e o Nome da Empresa
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        String token = config.getWhatsappToken();

        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Token do WhatsApp não configurado. Acesse as Configurações do sistema.");
        }

        // 2. Busca a Venda para saber quem é o cliente
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada!"));

        // Verifica se o cliente existe e tem telefone
        if (venda.getCliente() == null || venda.getCliente().getTelefone() == null) {
            throw new RuntimeException("Esta venda não possui um cliente com telefone válido vinculado.");
        }

        // Limpa o telefone (tira traços, parênteses e espaços)
        String telefoneDestino = venda.getCliente().getTelefone().replaceAll("\\D", "");

        // A Evolution API exige o código do país. Adiciona "55" (Brasil) se não tiver.
        if (!telefoneDestino.startsWith("55")) {
            telefoneDestino = "55" + telefoneDestino;
        }

        // 3. GERA O PDF E CONVERTE PARA BASE64
        byte[] pdfBytes = relatorioService.gerarPdfVenda(vendaId);
        String pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes); // A mágica acontece aqui!

        // 4. MONTA A MENSAGEM NO PADRÃO DA EVOLUTION API
        String urlEnvio = EVOLUTION_API_URL + "/message/sendMedia/" + INSTANCIA;

        Map<String, Object> payload = new HashMap<>();
        payload.put("number", telefoneDestino);

        // Faz o WhatsApp mostrar "Digitando..." ou "Enviando arquivo..." por 1 segundo (dá um toque humano)
        payload.put("options", Map.of("delay", 1200, "presence", "composing"));

        Map<String, Object> mediaMessage = new HashMap<>();
        mediaMessage.put("mediatype", "document");
        mediaMessage.put("fileName", "Recibo_Venda_" + venda.getId() + ".pdf");
        mediaMessage.put("caption", "Olá! Obrigado por comprar na *" + config.getNomeFantasia() + "*. \nSegue em anexo o recibo da sua compra.");
        mediaMessage.put("media", pdfBase64); // Coloca o arquivo embutido no texto!

        payload.put("mediaMessage", mediaMessage);

        // 5. ENVIA PARA A INTERNET (Evolution API)
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", token); // Autenticação com o seu Token!

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            // Dispara a requisição POST
            ResponseEntity<String> response = restTemplate.postForEntity(urlEnvio, request, String.class);
            System.out.println("WhatsApp enviado com sucesso! Status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("Erro ao enviar WhatsApp: " + e.getMessage());
            throw new RuntimeException("Falha na comunicação com o WhatsApp.");
        }
    }
}