package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.dto.AtualizarPrecoRequestDTO;
import com.grandport.erp.modules.estoque.dto.ProdutoRequestDTO;
import com.grandport.erp.modules.estoque.dto.ProdutoResponseDTO;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MovimentacaoEstoqueRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.estoque.service.FileStorageService;
import com.grandport.erp.modules.estoque.service.ProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired private ProdutoService service;
    @Autowired private FileStorageService fileService;
    @Autowired private ProdutoRepository produtoRepository;

    // Injeção do repositório para o histórico de estoque
    @Autowired private MovimentacaoEstoqueRepository movimentacaoRepository;

    // =========================================================================================
    // 1. ROTAS WEB (JSON PADRÃO) - O React usa estas rotas!
    // =========================================================================================

    @PostMapping
    public ResponseEntity<Produto> cadastrar(@RequestBody ProdutoRequestDTO dto) {
        // Envia null na foto, pois o React já envia a fotoUrl/fotoLocalPath direto no DTO
        return ResponseEntity.ok(service.cadastrar(dto, null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @RequestBody ProdutoRequestDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto, null));
    }

    // =========================================================================================
    // NOVA ROTA ADICIONADA: Busca produto por ID (Crucial para o Balcão atualizar estoque no estorno)
    // =========================================================================================
    @GetMapping("/{id}")
    @Operation(summary = "Busca produto por ID para sincronizar estoque no Front-end")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // =========================================================================================
    // 2. ROTAS MOBILE/AVANÇADAS (MULTIPART) - Para envio físico de arquivos
    // =========================================================================================

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Produto> cadastrarComFoto(
            @RequestPart("produto") ProdutoRequestDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile file) {

        String imagePath = null;
        if (file != null && !file.isEmpty()) {
            imagePath = fileService.salvarArquivo(file);
        }

        return ResponseEntity.ok(service.cadastrar(dto, imagePath));
    }

    @PutMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Produto> atualizarComFoto(
            @PathVariable Long id,
            @RequestPart("produto") ProdutoRequestDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile file) {

        String imagePath = null;
        if (file != null && !file.isEmpty()) {
            imagePath = fileService.salvarArquivo(file);
        }

        return ResponseEntity.ok(service.atualizar(id, dto, imagePath));
    }

    // =========================================================================================
    // 3. DEMAIS ROTAS (MANTIDAS INTACTAS)
    // =========================================================================================

    @PutMapping("/atualizar-precos")
    public ResponseEntity<Void> atualizarPrecos(@RequestBody List<AtualizarPrecoRequestDTO> precos) {
        service.atualizarPrecos(precos);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarProduto(@PathVariable Long id) {
        service.deleteProduto(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Lista todos os produtos ou filtra por termo")
    public ResponseEntity<List<Produto>> listarOuBuscar(@RequestParam(required = false) String busca) {
        if (busca != null && !busca.isEmpty()) {
            return ResponseEntity.ok(service.buscarProdutos(busca));
        }
        return ResponseEntity.ok(produtoRepository.findAll());
    }

    // =========================================================================================
    // ROTA PARA O HISTÓRICO DE INVENTÁRIO E AJUSTES
    // =========================================================================================
    @GetMapping("/movimentacoes")
    @Operation(summary = "Lista o histórico de movimentações e ajustes de estoque")
    public ResponseEntity<List<Map<String, Object>>> listarMovimentacoes() {
        List<com.grandport.erp.modules.estoque.model.MovimentacaoEstoque> movs = movimentacaoRepository.findAll();

        List<Map<String, Object>> dados = movs.stream().map(m -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", m.getId());
            map.put("tipo", m.getTipo());
            map.put("quantidade", m.getQuantidade());
            map.put("saldoAnterior", m.getSaldoAnterior());
            map.put("saldoAtual", m.getSaldoAtual());
            map.put("motivo", m.getMotivo());

            // CORREÇÃO AQUI: Usa o nome exato do campo no seu Model (dataMovimentacao)
            map.put("dataHora", m.getDataMovimentacao());

            if (m.getProduto() != null) {
                map.put("produtoNome", m.getProduto().getNome());
                map.put("produtoSku", m.getProduto().getSku());
            }
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(dados);
    }

    @GetMapping("/barcode/{ean}")
    @Operation(summary = "Busca rápida para App Mobile via Código de Barras")
    public ResponseEntity<Produto> buscarPorCodigoBarras(@PathVariable String ean) {
        return produtoRepository.findByCodigoBarras(ean)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mobile/scan/{ean}")
    public ResponseEntity<ProdutoResponseDTO> scanProduto(@PathVariable String ean) {
        return produtoRepository.findByCodigoBarras(ean)
                .map(p -> ResponseEntity.ok(new ProdutoResponseDTO(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/alertas")
    @Operation(summary = "Lista produtos com estoque abaixo do mínimo")
    public ResponseEntity<List<Produto>> listarAlertas() {
        return ResponseEntity.ok(service.listarAlertasEstoque());
    }

    @PatchMapping("/{id}/ajuste-estoque")
    public ResponseEntity<Produto> ajustarEstoque(
            @PathVariable Long id,
            @RequestBody Map<String, Object> dados) {

        Integer novaQuantidade = (Integer) dados.get("quantidade");
        String motivo = (String) dados.get("motivo");

        return ResponseEntity.ok(service.atualizarEstoque(id, novaQuantidade, motivo));
    }

    @GetMapping("/{id}/similares")
    @Operation(summary = "Busca produtos equivalentes (mesma Ref. Original)")
    public ResponseEntity<List<Produto>> getSimilares(@PathVariable Long id) {
        Produto p = service.findById(id);
        if (p.getReferenciaOriginal() == null || p.getReferenciaOriginal().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(produtoRepository.findByReferenciaOriginalAndIdNot(p.getReferenciaOriginal(), id));
    }
}