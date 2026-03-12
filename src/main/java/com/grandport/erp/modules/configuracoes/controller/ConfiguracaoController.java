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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    @Autowired
    private ConfiguracaoService service;

    @GetMapping
    public ResponseEntity<ConfiguracaoSistema> obterConfig() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    /**
     * 🚀 SALVAR CONFIGURAÇÕES: Agora este endpoint já recebe automaticamente
     * os novos campos de NFC-e (serieNfce, numeroProximaNfce, cscIdToken, cscCodigo)
     */
    @PutMapping
    public ResponseEntity<ConfiguracaoSistema> salvarConfig(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // =======================================================================
    // 🚀 CERTIFICADO DIGITAL (.PFX)
    // =======================================================================
    @PostMapping("/certificado")
    public ResponseEntity<String> uploadCertificado(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("{\"message\": \"Arquivo de certificado vazio.\"}");
        }

        try {
            // Define a pasta de certificados (Pode ser configurada no application.properties futuramente)
            String pastaCertificados = System.getProperty("user.dir") + "/certificados/";
            File diretorio = new File(pastaCertificados);
            if (!diretorio.exists()) {
                diretorio.mkdirs();
            }

            // Salva o arquivo. Em Produção, certificado_a1.pfx será lido pelo motor fiscal.
            Path caminhoArquivo = Paths.get(pastaCertificados + "certificado_a1.pfx");
            Files.write(caminhoArquivo, file.getBytes());

            return ResponseEntity.ok("{\"message\": \"Certificado digital salvo com sucesso e pronto para emissão!\"}");

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"message\": \"Erro ao salvar certificado: " + e.getMessage() + "\"}");
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
    // ⚠️ DICA: Em produção, garanta que apenas o ADMIN master tenha acesso aqui!
    public ResponseEntity<Void> resetarBancoDeDados() {
        service.resetarBancoDeDados();
        return ResponseEntity.ok().build();
    }
}