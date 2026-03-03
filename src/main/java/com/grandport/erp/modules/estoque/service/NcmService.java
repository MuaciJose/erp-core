package com.grandport.erp.modules.estoque.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
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
        // Configura o Mapper para ignorar diferença entre "Codigo" (JSON) e "codigo" (Java)
        ObjectMapper mapper = JsonMapper.builder()
                .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .build();

        JsonNode rootNode = mapper.readTree(arquivo.getInputStream());
        List<Ncm> ncms = new ArrayList<>();

        if (rootNode.isArray()) {
            ncms = mapper.convertValue(rootNode, new TypeReference<List<Ncm>>() {});
        } else if (rootNode.isObject()) {
            try {
                // Tenta mapear direto
                Ncm unicoNcm = mapper.convertValue(rootNode, Ncm.class);
                if (unicoNcm.getCodigo() != null) {
                    ncms.add(unicoNcm);
                } else {
                    // Tenta encontrar uma lista dentro de qualquer campo (ex: { "data": [...] })
                    Iterator<Map.Entry<String, JsonNode>> fields = rootNode.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        if (field.getValue().isArray()) {
                            List<Ncm> listaEncontrada = mapper.convertValue(field.getValue(), new TypeReference<List<Ncm>>() {});
                            if (!listaEncontrada.isEmpty()) {
                                ncms.addAll(listaEncontrada);
                                break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("Erro ao processar estrutura do JSON: " + e.getMessage());
            }
        }

        if (ncms.isEmpty()) {
            throw new RuntimeException("Nenhum NCM válido encontrado no arquivo.");
        }

        // Limpa NCMs com código nulo para evitar erro de banco
        ncms.removeIf(n -> n.getCodigo() == null || n.getCodigo().trim().isEmpty());

        // Salva em lotes (Batch) para performance
        repository.saveAll(ncms);
    }

    public List<Ncm> buscarNcm(String termo) {
        // Garante que o termo não vá nulo para o repositório
        if (termo == null) return new ArrayList<>();
        return repository.buscarPorTermo(termo);
    }
    @Transactional
    public void limparTabela() {
        repository.deleteAllInBatch(); // Mais rápido que o deleteAll comum
    }
}