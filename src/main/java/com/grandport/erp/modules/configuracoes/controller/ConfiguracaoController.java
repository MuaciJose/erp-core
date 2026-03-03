package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    @Autowired
    private ConfiguracaoService service;

    @GetMapping
    public ResponseEntity<ConfiguracaoSistema> obterConfig() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping
    public ResponseEntity<ConfiguracaoSistema> salvarConfig(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // =======================================================================
    // NOVO: ENDPOINT PARA GERAR BACKUP DO BANCO DE DADOS
    // =======================================================================
    @GetMapping("/backup")
    public ResponseEntity<Resource> gerarBackup() {
        Resource arquivoBackup = service.gerarArquivoBackup();

        String nomeArquivo = "backup_grandport_" + java.time.LocalDate.now() + ".sql";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/sql"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomeArquivo + "\"")
                .body(arquivoBackup);
    }

    // =======================================================================
    // NOVO: ENDPOINT PARA LIMPAR LOGS DO SISTEMA
    // =======================================================================
    @PostMapping("/limpar-logs")
    public ResponseEntity<Void> limparLogs() {
        service.limparLogsTecnicos();
        return ResponseEntity.ok().build();
    }
}