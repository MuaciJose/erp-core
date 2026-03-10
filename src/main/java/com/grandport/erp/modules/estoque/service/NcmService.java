package com.grandport.erp.modules.estoque.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NcmService {

    @Autowired
    private NcmRepository repository;

    @Transactional
    public void importarNcmDoJson(MultipartFile arquivo) throws IOException {
        ObjectMapper mapper = JsonMapper.builder()
                .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .build();

        JsonNode rootNode = mapper.readTree(arquivo.getInputStream());
        List<Ncm> ncmsJson = new ArrayList<>();

        if (rootNode.isArray()) {
            ncmsJson = mapper.convertValue(rootNode, new TypeReference<List<Ncm>>() {});
        } else if (rootNode.isObject()) {
            try {
                Ncm unicoNcm = mapper.convertValue(rootNode, Ncm.class);
                if (unicoNcm.getCodigo() != null) {
                    ncmsJson.add(unicoNcm);
                } else {
                    Iterator<Map.Entry<String, JsonNode>> fields = rootNode.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        if (field.getValue().isArray()) {
                            List<Ncm> listaEncontrada = mapper.convertValue(field.getValue(), new TypeReference<List<Ncm>>() {});
                            if (!listaEncontrada.isEmpty()) {
                                ncmsJson.addAll(listaEncontrada);
                                break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("Erro ao processar estrutura do JSON: " + e.getMessage());
            }
        }

        if (ncmsJson.isEmpty()) {
            throw new RuntimeException("Nenhum NCM válido encontrado no arquivo.");
        }

        // Limpa NCMs inválidos do JSON
        ncmsJson.removeIf(n -> n.getCodigo() == null || n.getCodigo().trim().isEmpty());

        // 🚀 LÓGICA DE UPSERT (Update ou Insert)

        // 1. Remove duplicatas que possam vir dentro do próprio JSON (mantém o último)
        Map<String, Ncm> mapaJson = new LinkedHashMap<>();
        for (Ncm n : ncmsJson) {
            mapaJson.put(n.getCodigo(), n);
        }

        // 2. Busca todos os NCMs que já existem no Banco de Dados
        List<Ncm> ncmsNoBanco = repository.findAll();
        Map<String, Ncm> mapaBanco = ncmsNoBanco.stream()
                .collect(Collectors.toMap(Ncm::getCodigo, n -> n, (n1, n2) -> n1));

        List<Ncm> ncmsParaSalvar = new ArrayList<>();

        // 3. Compara o JSON com o Banco
        for (Ncm ncmIncoming : mapaJson.values()) {
            Ncm ncmExistente = mapaBanco.get(ncmIncoming.getCodigo());

            if (ncmExistente != null) {
                // UPDATE: Se já existe, copia os dados do JSON por cima, mas MANTÉM o ID original!
                BeanUtils.copyProperties(ncmIncoming, ncmExistente, "id");
                ncmsParaSalvar.add(ncmExistente);
            } else {
                // INSERT: É um NCM novo, apenas adiciona na lista
                ncmsParaSalvar.add(ncmIncoming);
            }
        }

        // Salva tudo de uma vez (novos e atualizados)
        repository.saveAll(ncmsParaSalvar);
    }

    public List<Ncm> buscarNcm(String termo) {
        if (termo == null) return new ArrayList<>();
        return repository.buscarPorTermo(termo);
    }

    @Transactional
    public void limparTabela() {
        try {
            repository.deleteAllInBatch();
        } catch (DataIntegrityViolationException e) {
            // Captura o erro do banco e devolve uma mensagem limpa para o Frontend
            throw new RuntimeException("Não é possível limpar a tabela pois existem produtos ou notas usando estes NCMs. Apenas faça o upload do novo arquivo para atualizar os dados.");
        }
    }
}