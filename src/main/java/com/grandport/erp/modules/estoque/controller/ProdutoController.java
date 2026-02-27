package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.estoque.dto.ProdutoRequestDTO;
import com.grandport.erp.modules.estoque.dto.ProdutoResponseDTO;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.estoque.service.FileStorageService;
import com.grandport.erp.modules.estoque.service.ProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired private ProdutoService service;
    @Autowired private FileStorageService fileService;
    @Autowired private ProdutoRepository produtoRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Produto> cadastrarComFoto(
            @RequestPart("produto") ProdutoRequestDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile file) {
        
        String imagePath = null;
        if (file != null && !file.isEmpty()) {
            imagePath = fileService.salvarArquivo(file);
        }

        return ResponseEntity.ok(service.cadastrar(dto, imagePath));
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
            .map(p -> ResponseEntity.ok(new ProdutoResponseDTO(p))) // Retorna dados + URL da Foto
            .orElse(ResponseEntity.notFound().build());
    }
}
