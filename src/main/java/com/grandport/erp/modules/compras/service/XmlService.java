package com.grandport.erp.modules.compras.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class XmlService {

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired
    private AuditoriaService auditoriaService;

    public NfeProcDTO lerXml(MultipartFile arquivo) throws Exception {
        XmlMapper xmlMapper = new XmlMapper();
        xmlMapper.registerModule(new JavaTimeModule()); // Registra o módulo de data/hora
        xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Guarda o resultado na variável sem alterar como o Jackson faz a leitura
        NfeProcDTO nfeProc = xmlMapper.readValue(arquivo.getInputStream(), NfeProcDTO.class);

        // 🚀 3. REGISTRO DE LEITURA DO ARQUIVO (Rastreabilidade)
        String nomeArquivo = arquivo.getOriginalFilename() != null ? arquivo.getOriginalFilename() : "Desconhecido";
        auditoriaService.registrar("COMPRAS", "UPLOAD_XML", "Upload e leitura bem-sucedida do arquivo: " + nomeArquivo);

        // Retorna exatamente o que retornava antes
        return nfeProc;
    }
}