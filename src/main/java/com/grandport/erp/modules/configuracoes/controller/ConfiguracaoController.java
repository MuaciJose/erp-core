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

import java.util.Map;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    @Autowired
    private ConfiguracaoService service;

    @Autowired
    private com.grandport.erp.modules.configuracoes.service.ManutencaoService manutencaoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'CONFIGURADOR')")
    public ResponseEntity<ConfiguracaoSistema> obterConfig() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'CONFIGURADOR')")
    public ResponseEntity<ConfiguracaoSistema> salvarConfig(@RequestBody ConfiguracaoSistema config) {
        return ResponseEntity.ok(service.atualizarConfiguracao(config));
    }

    // 🆕 POST também funciona (alternativa ao PUT para compatibilidade)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'CONFIGURADOR')")
    public ResponseEntity<ConfiguracaoSistema> salvarConfigPost(@RequestBody ConfiguracaoSistema config) {
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



    // =========================================================
    // 🧹 ROTA DO ROBÔ: LIMPEZA DE FOTOS ANTIGAS
    // =========================================================
    @PostMapping("/manutencao/limpar-fotos-vistorias")
    public ResponseEntity<Map<String, Object>> limparFotosAntigas(
            @RequestParam(defaultValue = "24") int meses) { // Por padrão, apaga fotos com mais de 2 anos (24 meses)

        Map<String, Object> resultado = manutencaoService.limparFotosVistoriasAntigas(meses);
        return ResponseEntity.ok(resultado);
    }

    // =======================================================================
    // 🎨 CENTRAL DE LAYOUTS - GERENCIADOR DE TEMPLATES HTML
    // =======================================================================

    @GetMapping("/layouts")
    public ResponseEntity<Map<String, Object>> obterTodosLayouts() {
        ConfiguracaoSistema config = service.obterConfiguracao();
        
        Map<String, Object> layouts = new java.util.HashMap<>();
        layouts.put("extratoCliente", config.getLayoutHtmlExtratoCliente());
        layouts.put("extratoFornecedor", config.getLayoutHtmlExtratoFornecedor());
        layouts.put("os", config.getLayoutHtmlOs());
        layouts.put("venda", config.getLayoutHtmlVenda());
        layouts.put("recibo", config.getLayoutHtmlRecibo());
        layouts.put("reciboPagamento", config.getLayoutHtmlReciboPagamento());
        layouts.put("fechamentoCaixa", config.getLayoutHtmlFechamentoCaixa());
        layouts.put("espelhoNota", config.getLayoutHtmlEspelhoNota());
        layouts.put("dre", config.getLayoutHtmlDre());
        layouts.put("relatorioComissao", config.getLayoutHtmlRelatorioComissao());
        layouts.put("relatorioContasPagar", config.getLayoutHtmlRelatorioContasPagar());
        layouts.put("relatorioContasReceber", config.getLayoutHtmlRelatorioContasReceber());
        
        return ResponseEntity.ok(layouts);
    }

    @GetMapping("/layouts/{tipoLayout}")
    public ResponseEntity<Map<String, String>> obterLayout(@PathVariable String tipoLayout) {
        ConfiguracaoSistema config = service.obterConfiguracao();
        String html = null;
        
        switch (tipoLayout.toLowerCase()) {
            case "extratocliente":
                html = config.getLayoutHtmlExtratoCliente();
                break;
            case "extratofornecedor":
                html = config.getLayoutHtmlExtratoFornecedor();
                break;
            case "os":
                html = config.getLayoutHtmlOs();
                break;
            case "venda":
                html = config.getLayoutHtmlVenda();
                break;
            case "recibo":
                html = config.getLayoutHtmlRecibo();
                break;
            case "recibopagamento":
                html = config.getLayoutHtmlReciboPagamento();
                break;
            case "fechamentocaixa":
                html = config.getLayoutHtmlFechamentoCaixa();
                break;
            case "espelhonota":
                html = config.getLayoutHtmlEspelhoNota();
                break;
            case "dre":
                html = config.getLayoutHtmlDre();
                break;
            case "relatoriocomissao":
                html = config.getLayoutHtmlRelatorioComissao();
                break;
            case "relatoriocontaspagar":
                html = config.getLayoutHtmlRelatorioContasPagar();
                break;
            case "relatoriocontasreceber":
                html = config.getLayoutHtmlRelatorioContasReceber();
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Tipo de layout não encontrado: " + tipoLayout));
        }
        
        return ResponseEntity.ok(Map.of("tipoLayout", tipoLayout, "html", html != null ? html : ""));
    }

    @PutMapping("/layouts/{tipoLayout}")
    public ResponseEntity<Map<String, String>> atualizarLayout(
            @PathVariable String tipoLayout,
            @RequestBody Map<String, String> payload) {
        
        String html = payload.get("html");
        if (html == null || html.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "HTML não pode estar vazio"));
        }
        
        ConfiguracaoSistema config = service.obterConfiguracao();
        
        switch (tipoLayout.toLowerCase()) {
            case "extratocliente":
                config.setLayoutHtmlExtratoCliente(html);
                break;
            case "extratofornecedor":
                config.setLayoutHtmlExtratoFornecedor(html);
                break;
            case "os":
                config.setLayoutHtmlOs(html);
                break;
            case "venda":
                config.setLayoutHtmlVenda(html);
                break;
            case "recibo":
                config.setLayoutHtmlRecibo(html);
                break;
            case "recibopagamento":
                config.setLayoutHtmlReciboPagamento(html);
                break;
            case "fechamentocaixa":
                config.setLayoutHtmlFechamentoCaixa(html);
                break;
            case "espelhonota":
                config.setLayoutHtmlEspelhoNota(html);
                break;
            case "dre":
                config.setLayoutHtmlDre(html);
                break;
            case "relatoriocomissao":
                config.setLayoutHtmlRelatorioComissao(html);
                break;
            case "relatoriocontaspagar":
                config.setLayoutHtmlRelatorioContasPagar(html);
                break;
            case "relatoriocontasreceber":
                config.setLayoutHtmlRelatorioContasReceber(html);
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Tipo de layout não encontrado: " + tipoLayout));
        }
        
        service.atualizarConfiguracao(config);
        
        return ResponseEntity.ok(Map.of("mensagem", "Layout atualizado com sucesso!", "tipoLayout", tipoLayout));
    }

    @PostMapping("/layouts/reset/{tipoLayout}")
    public ResponseEntity<Map<String, String>> resetarLayout(@PathVariable String tipoLayout) {
        ConfiguracaoSistema config = service.obterConfiguracao();
        
        // Define templates padrão vazios (será usado o template padrão do código)
        switch (tipoLayout.toLowerCase()) {
            case "extratocliente":
                config.setLayoutHtmlExtratoCliente(null);
                break;
            case "extratofornecedor":
                config.setLayoutHtmlExtratoFornecedor(null);
                break;
            case "os":
                config.setLayoutHtmlOs(null);
                break;
            case "venda":
                config.setLayoutHtmlVenda(null);
                break;
            case "recibo":
                config.setLayoutHtmlRecibo(null);
                break;
            case "recibopagamento":
                config.setLayoutHtmlReciboPagamento(null);
                break;
            case "fechamentocaixa":
                config.setLayoutHtmlFechamentoCaixa(null);
                break;
            case "espelhonota":
                config.setLayoutHtmlEspelhoNota(null);
                break;
            case "dre":
                config.setLayoutHtmlDre(null);
                break;
            case "relatoriocomissao":
                config.setLayoutHtmlRelatorioComissao(null);
                break;
            case "relatoriocontaspagar":
                config.setLayoutHtmlRelatorioContasPagar(null);
                break;
            case "relatoriocontasreceber":
                config.setLayoutHtmlRelatorioContasReceber(null);
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Tipo de layout não encontrado: " + tipoLayout));
        }
        
        service.atualizarConfiguracao(config);
        
        return ResponseEntity.ok(Map.of("mensagem", "Layout resetado para padrão!", "tipoLayout", tipoLayout));
    }
}