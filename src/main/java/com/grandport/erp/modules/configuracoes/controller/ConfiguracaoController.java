package com.grandport.erp.modules.configuracoes.controller;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

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
    // 🚀 CERTIFICADO DIGITAL (.PFX) - ATUALIZADO
    // =======================================================================
    @PostMapping("/certificado")
    public ResponseEntity<?> uploadCertificado(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Arquivo de certificado vazio."));
        }

        try {
            // 🚀 AGORA CHAMA O SERVICE QUE SALVA COM O NOME DO CNPJ
            service.salvarCertificadoDigital(file);

            return ResponseEntity.ok(Map.of("message", "Certificado digital salvo com sucesso e vinculado ao CNPJ!"));

        } catch (Exception e) {
            // Em caso de erro (ex: CNPJ não preenchido), retorna a mensagem real do Service
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao salvar certificado: " + e.getMessage()));
        }
    }

    // =======================================================================
    // BACKUP, LOGS E MANUTENÇÃO
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

    @PostMapping("/limpar-logs")
    public ResponseEntity<Void> limparLogs() {
        service.limparLogsTecnicos();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restaurar-banco")
    public ResponseEntity<String> uploadBanco(@RequestParam("file") MultipartFile file) {
        try {
            service.restaurarBackup(file);
            return ResponseEntity.ok("{\"message\": \"Banco de dados restaurado com sucesso!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Falha na restauração: " + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/resetar-banco")
    public ResponseEntity<Void> resetarBancoDeDados() {
        service.resetarBancoDeDados();
        return ResponseEntity.ok().build();
    }
}