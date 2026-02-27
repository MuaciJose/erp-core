package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.dto.ItemVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class VendaService {
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private VendaRepository vendaRepository;

    @Transactional
    public Venda finalizarVenda(VendaRequestDTO dto) {
        Venda venda = new Venda();
        BigDecimal total = BigDecimal.ZERO;

        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoId())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

            // Validação de Stock
            if (produto.getQuantidadeEstoque() < itemDTO.quantidade()) {
                throw new RuntimeException("Stock insuficiente: " + produto.getNome());
            }

            // Abate no Stock
            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDTO.quantidade());
            
            ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(), produto.getPrecoVenda());
            venda.getItens().add(item);
            
            total = total.add(produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemDTO.quantidade())));
        }
        
        venda.setValorTotal(total);
        return vendaRepository.save(venda);
    }
}
