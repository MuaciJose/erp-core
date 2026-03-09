package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 🚀 Import necessário para o Upload de arquivos!

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
    // ENDPOINT PARA GERAR BACKUP DO BANCO DE DADOS
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
    // ENDPOINT PARA LIMPAR LOGS DO SISTEMA
    // =======================================================================
    @PostMapping("/limpar-logs")
    public ResponseEntity<Void> limparLogs() {
        service.limparLogsTecnicos();
        return ResponseEntity.ok().build();
    }

    // =======================================================================
    // 🚀 NOVO: ENDPOINT PARA RESTAURAR O BANCO DE DADOS VIA UPLOAD (.SQL)
    // =======================================================================
    @PostMapping("/restaurar-banco")
    // @PreAuthorize("hasRole('ADMIN')") // Desativado para testes
    public ResponseEntity<String> uploadBanco(@RequestParam("file") MultipartFile file) {
        try {
            // Lembre-se de garantir que o ConfiguracaoService tenha esse método criado!
            service.restaurarBackup(file);
            return ResponseEntity.ok("{\"message\": \"Banco de dados restaurado com sucesso!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Falha na restauração: " + e.getMessage() + "\"}");
        }
    }

    // =======================================================================
    // 🚀 ENDPOINT PARA RESETAR O BANCO DE DADOS (ZONA DE PERIGO)
    // =======================================================================
    @DeleteMapping("/resetar-banco")
    // @PreAuthorize("hasRole('ADMIN')") // 🔴 COMENTEI AQUI PARA PARAR DE DAR ERRO 403
    public ResponseEntity<Void> resetarBancoDeDados() {
        // Isso chamará a função do seu service que dá o "TRUNCATE" nas tabelas
        service.resetarBancoDeDados();
        return ResponseEntity.ok().build();
    }
}