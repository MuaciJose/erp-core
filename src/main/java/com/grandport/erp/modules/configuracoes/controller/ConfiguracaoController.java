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
import org.springframework.web.multipart.MultipartFile;

// 🚀 Imports necessários para salvar o certificado na pasta
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

    @PutMapping
    public ResponseEntity<ConfiguracaoSistema> salvarConfig(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // =======================================================================
    // 🚀 NOVO: ENDPOINT PARA RECEBER O CERTIFICADO DIGITAL (.PFX)
    // =======================================================================
    @PostMapping("/certificado")
    public ResponseEntity<String> uploadCertificado(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("{\"message\": \"Arquivo de certificado vazio.\"}");
        }

        try {
            // Cria uma pasta chamada "certificados" na raiz do projeto Java
            String pastaCertificados = System.getProperty("user.dir") + "/certificados/";
            File diretorio = new File(pastaCertificados);
            if (!diretorio.exists()) {
                diretorio.mkdirs(); // Se a pasta não existir, o Java cria ela
            }

            // Salva o arquivo no disco (Sempre substitui pelo novo com o mesmo nome)
            Path caminhoArquivo = Paths.get(pastaCertificados + "certificado_a1.pfx");
            Files.write(caminhoArquivo, file.getBytes());

            return ResponseEntity.ok("{\"message\": \"Certificado digital salvo com sucesso e pronto para emissão!\"}");

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"message\": \"Erro ao salvar certificado: " + e.getMessage() + "\"}");
        }
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
    // ENDPOINT PARA RESTAURAR O BANCO DE DADOS VIA UPLOAD (.SQL)
    // =======================================================================
    @PostMapping("/restaurar-banco")
    // @PreAuthorize("hasRole('ADMIN')") // Desativado para testes
    public ResponseEntity<String> uploadBanco(@RequestParam("file") MultipartFile file) {
        try {
            service.restaurarBackup(file);
            return ResponseEntity.ok("{\"message\": \"Banco de dados restaurado com sucesso!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Falha na restauração: " + e.getMessage() + "\"}");
        }
    }

    // =======================================================================
    // ENDPOINT PARA RESETAR O BANCO DE DADOS (ZONA DE PERIGO)
    // =======================================================================
    @DeleteMapping("/resetar-banco")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetarBancoDeDados() {
        service.resetarBancoDeDados();
        return ResponseEntity.ok().build();
    }
}