package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.parceiro.dto.BrasilApiCepDTO;
import com.grandport.erp.modules.parceiro.dto.BrasilApiCnpjDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ConsultaDocumentoService {

    private final RestTemplate restTemplate = new RestTemplate();

    public BrasilApiCnpjDTO consultarCnpj(String cnpj) {
        String url = "https://brasilapi.com.br/api/cnpj/v1/" + cnpj.replaceAll("[^0-9]", "");
        try {
            return restTemplate.getForObject(url, BrasilApiCnpjDTO.class);
        } catch (Exception e) {
            System.err.println("Erro ao consultar CNPJ: " + e.getMessage());
            return null;
        }
    }

    public BrasilApiCepDTO consultarCep(String cep) {
        String url = "https://brasilapi.com.br/api/cep/v1/" + cep.replaceAll("[^0-9]", "");
        try {
            return restTemplate.getForObject(url, BrasilApiCepDTO.class);
        } catch (Exception e) {
            System.err.println("Erro ao consultar CEP: " + e.getMessage());
            return null;
        }
    }
}
