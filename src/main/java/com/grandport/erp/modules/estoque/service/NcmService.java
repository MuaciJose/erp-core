package com.grandport.erp.modules.estoque.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NcmService {

    @Autowired
    private NcmRepository repository;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private EmpresaContextService empresaContextService;

    @Transactional
    public void importarNcmDoJson(MultipartFile arquivo) throws IOException {
        Long empresaId = empresaContextService.getRequiredEmpresaId();

        ObjectMapper mapper = JsonMapper.builder()
                .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .build();

        JsonNode rootNode = mapper.readTree(arquivo.getInputStream());
        List<Ncm> ncmsJson = new ArrayList<>();
        coletarNcms(rootNode, ncmsJson, empresaId);

        if (ncmsJson.isEmpty()) {
            throw new RuntimeException("Nenhum NCM válido encontrado no arquivo.");
        }

        ncmsJson.removeIf(n -> n.getCodigo() == null || n.getCodigo().trim().isEmpty());

        Map<String, Ncm> mapaJson = new LinkedHashMap<>();
        for (Ncm n : ncmsJson) {
            mapaJson.put(n.getCodigo(), n);
        }

        List<Ncm> ncmsNoBanco = repository.findAll();
        Map<String, Ncm> mapaBanco = ncmsNoBanco.stream()
                .collect(Collectors.toMap(Ncm::getCodigo, n -> n, (n1, n2) -> n1));

        List<Ncm> ncmsParaSalvar = new ArrayList<>();
        for (Ncm ncmIncoming : mapaJson.values()) {
            Ncm ncmExistente = mapaBanco.get(ncmIncoming.getCodigo());

            if (ncmExistente != null) {
                BeanUtils.copyProperties(ncmIncoming, ncmExistente, "id");
                ncmExistente.setEmpresaId(empresaId);
                ncmsParaSalvar.add(ncmExistente);
            } else {
                ncmsParaSalvar.add(ncmIncoming);
            }
        }

        repository.saveAll(ncmsParaSalvar);

        String nomeArq = arquivo.getOriginalFilename() != null ? arquivo.getOriginalFilename() : "Desconhecido";
        auditoriaService.registrar("SISTEMA", "IMPORTACAO_NCM",
                "A base fiscal de NCMs foi atualizada em lote via JSON (" + nomeArq + "). Total processado: " + ncmsParaSalvar.size() + " registros.");
    }

    public List<Ncm> buscarNcm(String termo) {
        if (termo == null) return new ArrayList<>();
        return repository.buscarPorTermo(termo, empresaContextService.getRequiredEmpresaId());
    }

    @Transactional
    public void limparTabela() {
        try {
            repository.deleteAllInBatch();
            auditoriaService.registrar("SISTEMA", "EXCLUSAO_NCM_LOTE", "ALERTA: A tabela de NCMs foi completamente esvaziada pelo usuário.");
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Não é possível limpar a tabela pois existem produtos ou notas usando estes NCMs. Apenas faça o upload do novo arquivo para atualizar os dados.");
        }
    }

    private void coletarNcms(JsonNode node, List<Ncm> destino, Long empresaId) {
        if (node == null || node.isNull()) {
            return;
        }

        if (node.isArray()) {
            for (JsonNode item : node) {
                coletarNcms(item, destino, empresaId);
            }
            return;
        }

        if (!node.isObject()) {
            return;
        }

        Ncm ncm = montarNcm(node, empresaId);
        if (ncm != null) {
            destino.add(ncm);
        }

        Iterator<JsonNode> children = node.elements();
        while (children.hasNext()) {
            coletarNcms(children.next(), destino, empresaId);
        }
    }

    private Ncm montarNcm(JsonNode node, Long empresaId) {
        String codigo = texto(node, "Codigo", "codigo", "Código", "NCM", "ncm", "CO_NCM");
        if (codigo == null || codigo.isBlank()) {
            return null;
        }

        Ncm ncm = new Ncm();
        ncm.setEmpresaId(empresaId);
        ncm.setCodigo(codigo.trim());
        ncm.setDescricao(texto(node, "Descricao", "descricao", "Descrição", "NO_NCM"));
        ncm.setDataInicio(texto(node, "Data_Inicio", "dataInicio", "DATA_INICIO"));
        ncm.setDataFim(texto(node, "Data_Fim", "dataFim", "DATA_FIM"));
        ncm.setNumeroAto(texto(node, "Numero_Ato_Ini", "numeroAto", "NUMERO_ATO_INI"));
        return ncm;
    }

    private String texto(JsonNode node, String... chaves) {
        for (String chave : chaves) {
            JsonNode value = node.get(chave);
            if (value != null && !value.isNull()) {
                String texto = value.asText();
                if (texto != null && !texto.isBlank()) {
                    return texto;
                }
            }
        }
        return null;
    }
}
