package com.grandport.erp.modules.compras.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class XmlService {

    public NfeProcDTO lerXml(MultipartFile arquivo) throws Exception {
        XmlMapper xmlMapper = new XmlMapper();
        xmlMapper.registerModule(new JavaTimeModule()); // Registra o módulo de data/hora
        xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        return xmlMapper.readValue(arquivo.getInputStream(), NfeProcDTO.class);
    }
}
