package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.parceiro.dto.CepDTO;
import com.grandport.erp.modules.parceiro.dto.CnpjDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ConsultaExternaService {

    private final RestTemplate restTemplate = new RestTemplate();

    public CepDTO buscarCep(String cep) {
        String url = "https://viacep.com.br/ws/" + cep + "/json/";
        return restTemplate.getForObject(url, CepDTO.class);
    }

    public CnpjDTO buscarCnpj(String cnpj) {
        // BrasilAPI é excelente e gratuita para CNPJ
        String url = "https://brasilapi.com.br/api/cnpj/v1/" + cnpj;
        return restTemplate.getForObject(url, CnpjDTO.class);
    }
}
