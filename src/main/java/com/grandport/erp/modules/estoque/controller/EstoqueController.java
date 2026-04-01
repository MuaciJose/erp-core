package com.grandport.erp.modules.estoque.controller;

import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.estoque.dto.PrevisaoCompraDTO;
import com.grandport.erp.modules.estoque.model.MovimentacaoEstoque;
import com.grandport.erp.modules.estoque.repository.MovimentacaoEstoqueRepository;
import com.grandport.erp.modules.estoque.service.EstoqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    @Autowired private MovimentacaoEstoqueRepository estoqueRepository;
    @Autowired private EstoqueService estoqueService;
    @Autowired private EmpresaContextService empresaContextService;

    @GetMapping("/produto/{produtoId}/historico")
    public ResponseEntity<List<MovimentacaoEstoque>> getHistorico(@PathVariable Long produtoId) {
        return ResponseEntity.ok(estoqueRepository.findByProdutoIdAndEmpresaIdOrderByDataMovimentacaoDesc(
                produtoId,
                empresaContextService.getRequiredEmpresaId()
        ));
    }

    @GetMapping("/previsao-reposicao")
    public ResponseEntity<List<PrevisaoCompraDTO>> getPrevisao() {
        return ResponseEntity.ok(estoqueService.gerarPrevisaoReposicao());
    }
}
