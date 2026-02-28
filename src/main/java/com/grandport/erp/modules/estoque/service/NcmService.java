package com.grandport.erp.modules.estoque.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
public class NcmService {

    @Autowired
    private NcmRepository repository;

    @Transactional
    public void importarNcmDoJson(MultipartFile arquivo) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        JsonNode rootNode = mapper.readTree(arquivo.getInputStream());
        List<Ncm> ncms = new ArrayList<>();

        if (rootNode.isArray()) {
            // Caso 1: É uma lista direta [ { ... }, { ... } ]
            ncms = mapper.convertValue(rootNode, new TypeReference<List<Ncm>>() {});
        } else if (rootNode.isObject()) {
            // Caso 2: É um objeto único { "Codigo": "..." }
            try {
                Ncm unicoNcm = mapper.convertValue(rootNode, Ncm.class);
                if (unicoNcm.getCodigo() != null) {
                    ncms.add(unicoNcm);
                } else {
                    // Caso 3: É um objeto wrapper { "Ncm": [ ... ] }
                    Iterator<Map.Entry<String, JsonNode>> fields = rootNode.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        if (field.getValue().isArray()) {
                            try {
                                List<Ncm> listaEncontrada = mapper.convertValue(field.getValue(), new TypeReference<List<Ncm>>() {});
                                if (!listaEncontrada.isEmpty() && listaEncontrada.get(0).getCodigo() != null) {
                                    ncms.addAll(listaEncontrada);
                                    break;
                                }
                            } catch (Exception e) {
                                // Ignora
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Ignora e tenta a estratégia de wrapper
            }
        }

        if (ncms.isEmpty()) {
            throw new RuntimeException("Nenhum NCM válido encontrado. Verifique se o JSON é uma lista [...] ou um objeto único válido.");
        }

        repository.saveAll(ncms);
    }

    public List<Ncm> buscarNcm(String termo) {
        return repository.buscarPorTermo(termo);
    }
}
