package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.service.NcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ncms")
@Tag(name = "Fiscal - NCM")
public class NcmController {

    @Autowired
    private NcmService service;

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

    // NOVA ROTA: LIMPAR TABELA (ESSENCIAL ANTES DE NOVA IMPORTAÇÃO)
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

    @GetMapping
    @Operation(summary = "Lista ou Busca NCM por código ou descrição (Usado pelo Autocomplete)")
    public ResponseEntity<List<Ncm>> listarOuBuscar(@RequestParam(value = "busca", required = false) String busca) {
        if (busca == null || busca.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Ncm> resultados = service.buscarNcm(busca);

        // Limita a 50 resultados para manter a performance do Front-end
        if (resultados.size() > 50) {
            return ResponseEntity.ok(resultados.subList(0, 50));
        }

        return ResponseEntity.ok(resultados);
    }

    // Mantido por compatibilidade
    @GetMapping("/busca")
    public ResponseEntity<List<Ncm>> buscar(@RequestParam("q") String termo) {
        return ResponseEntity.ok(service.buscarNcm(termo));
    }
}