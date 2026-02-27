package com.grandport.erp.modules.estoque.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class NcmService {

    @Autowired
    private NcmRepository repository;

    @Transactional
    public void importarNcmDoJson(MultipartFile arquivo) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        
        // Configura o Jackson para não dar erro se o JSON tiver campos a mais que a nossa classe
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        List<Ncm> ncms = mapper.readValue(
            arquivo.getInputStream(), 
            new TypeReference<List<Ncm>>() {}
        );

        // No padrão SAP/TOTVS, usamos saveAll para inserção em lote (Batch Insert)
        repository.saveAll(ncms);
    }
}