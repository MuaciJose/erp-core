package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.dto.PrevisaoCompraDTO;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.repository.ItemVendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EstoqueService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private ItemVendaRepository itemVendaRepository;

    public List<PrevisaoCompraDTO> gerarPrevisaoReposicao() {
        List<Produto> produtos = produtoRepository.findAll();

        return produtos.stream()
            .map(p -> {
                Double media = itemVendaRepository.findMediaVendaDiariaByProdutoId(p.getId());
                return new PrevisaoCompraDTO(p.getId(), p.getNome(), p.getQuantidadeEstoque(), media);
            })
            .filter(dto -> dto.getSugestaoCompra() > 0) // Mostra apenas o que precisa comprar
            .sorted((a, b) -> a.getDiasRestantes().compareTo(b.getDiasRestantes())) // Mais urgentes primeiro
            .collect(Collectors.toList());
    }
}
