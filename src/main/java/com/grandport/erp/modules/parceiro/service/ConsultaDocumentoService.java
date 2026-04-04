package com.grandport.erp.modules.parceiro.service;

import com.grandport.erp.modules.parceiro.dto.BrasilApiCepDTO;
import com.grandport.erp.modules.parceiro.dto.BrasilApiCnpjDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ConsultaDocumentoService {

    private static final Logger log = LoggerFactory.getLogger(ConsultaDocumentoService.class);

    private final RestTemplate restTemplate = new RestTemplate();

    public BrasilApiCnpjDTO consultarCnpj(String cnpj) {
        String url = "https://brasilapi.com.br/api/cnpj/v1/" + cnpj.replaceAll("[^0-9]", "");
        try {
            return restTemplate.getForObject(url, BrasilApiCnpjDTO.class);
        } catch (Exception e) {
            log.warn("Erro ao consultar CNPJ {}", cnpj, e);
            return null;
        }
    }

    public BrasilApiCepDTO consultarCep(String cep) {
        String url = "https://brasilapi.com.br/api/cep/v1/" + cep.replaceAll("[^0-9]", "");
        try {
            return restTemplate.getForObject(url, BrasilApiCepDTO.class);
        } catch (Exception e) {
            log.warn("Erro ao consultar CEP {}", cep, e);
            return null;
        }
    }
}
