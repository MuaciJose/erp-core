package com.grandport.erp.modules.compras.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.grandport.erp.modules.compras.dto.NfeDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class XmlService {

    public NfeDTO lerXml(MultipartFile arquivo) throws Exception {
        XmlMapper xmlMapper = new XmlMapper();
        // Configura para ignorar tags que não precisamos (como transportadora)
        xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // O Jackson mapeia a estrutura do XML para o seu DTO
        return xmlMapper.readValue(arquivo.getInputStream(), NfeDTO.class);
    }
}
