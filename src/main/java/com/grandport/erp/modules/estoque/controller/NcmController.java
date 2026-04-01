package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.service.NcmService;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ncm")
@Tag(name = "Fiscal - NCM")
public class NcmController {

    @Autowired
    private NcmService service;

    // 🚀 ADICIONADO PARA A PAGINAÇÃO
    @Autowired
    private NcmRepository repository;

    @Autowired
    private EmpresaContextService empresaContextService;

    @PostMapping("/upload")
    @Operation(summary = "Faz o upload de um JSON com a lista de NCMs")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        try {
            service.importarNcmDoJson(file);
            return ResponseEntity.ok("Importação de " + file.getOriginalFilename() + " concluída!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar JSON: " + e.getMessage());
        }
    }

    @DeleteMapping("/limpar-todos")
    @Operation(summary = "Remove todos os NCMs cadastrados para permitir uma nova importação limpa")
    public ResponseEntity<Map<String, String>> limparTudo() {
        try {
            service.limparTabela();
            return ResponseEntity.ok(Map.of("message", "Tabela de NCMs limpa com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erro ao limpar tabela: " + e.getMessage()));
        }
    }

    // Mantido intacto para o Autocomplete de Produtos e Orçamento
    @GetMapping
    @Operation(summary = "Lista ou Busca NCM por código ou descrição (Usado pelo Autocomplete)")
    public ResponseEntity<List<Ncm>> listarOuBuscar(@RequestParam(value = "busca", required = false) String busca) {
        if (busca == null || busca.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Ncm> resultados = service.buscarNcm(busca);

        if (resultados.size() > 50) {
            return ResponseEntity.ok(resultados.subList(0, 50));
        }

        return ResponseEntity.ok(resultados);
    }

    // 🚀 NOVA ROTA: Específica para a tabela de listagem do React
    @GetMapping("/paginado")
    @Operation(summary = "Lista NCMs com paginação")
    public ResponseEntity<Page<Ncm>> listarPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String busca) {

        // Ordena pelo código NCM de forma crescente
        Pageable pageable = PageRequest.of(page, size, Sort.by("codigo").ascending());
        Page<Ncm> ncms = repository.buscarPaginado(busca, empresaContextService.getRequiredEmpresaId(), pageable);

        return ResponseEntity.ok(ncms);
    }

    // Mantido por compatibilidade
    @GetMapping("/busca")
    public ResponseEntity<List<Ncm>> buscar(@RequestParam("q") String termo) {
        return ResponseEntity.ok(service.buscarNcm(termo));
    }
}
