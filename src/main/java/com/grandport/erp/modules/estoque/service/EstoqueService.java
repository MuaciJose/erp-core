package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.dto.PrevisaoCompraDTO;
import com.grandport.erp.modules.estoque.model.MovimentacaoEstoque;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MovimentacaoEstoqueRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.vendas.repository.ItemVendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EstoqueService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private ItemVendaRepository itemVendaRepository;

    // 🚀 Repositório para gravar o extrato
    @Autowired private MovimentacaoEstoqueRepository movimentacaoRepository;

    /**
     * REGISTRA UMA MOVIMENTAÇÃO NO EXTRATO E ATUALIZA O SALDO REAL
     * Usado por: Entrada de XML, Vendas e Ajustes Manuais.
     */
    @Transactional
    public void registrarMovimentacao(Produto produto, Integer qtd, String tipo, String motivo, String parceiro, String documento) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setQuantidade(qtd);
        mov.setTipo(tipo);
        mov.setMotivo(motivo);
        mov.setParceiro(parceiro); // 🚀 Salva o Cliente/Fornecedor
        mov.setDocumento(documento); // 🚀 Salva o Nº da Nota

        // Garante que a data seja gravada no momento exato do registro
        mov.setDataMovimentacao(LocalDateTime.now());

        int saldoAnterior = (produto.getQuantidadeEstoque() != null) ? produto.getQuantidadeEstoque() : 0;
        mov.setSaldoAnterior(saldoAnterior);

        // Lógica de cálculo de saldo
        int novoSaldo = tipo.equalsIgnoreCase("ENTRADA") ? saldoAnterior + qtd : saldoAnterior - qtd;
        mov.setSaldoAtual(novoSaldo);

        // 1. Atualiza o saldo no cadastro do produto
        produto.setQuantidadeEstoque(novoSaldo);
        produtoRepository.save(produto);

        // 2. Grava a movimentação no histórico
        movimentacaoRepository.save(mov);
    }

    /**
     * Retorna o histórico para o "reloginho" do React
     */
    public List<MovimentacaoEstoque> listarHistoricoPorProduto(Long produtoId) {
        return movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(produtoId);
    }

    /**
     * SUA LÓGICA ORIGINAL: Previsão de Compras (Mantida 100%)
     */
    public List<PrevisaoCompraDTO> gerarPrevisaoReposicao() {
        List<Produto> produtos = produtoRepository.findAll();

        return produtos.stream()
                .map(p -> {
                    Double media = itemVendaRepository.findMediaVendaDiariaByProdutoId(p.getId());
                    return new PrevisaoCompraDTO(p.getId(), p.getNome(), p.getQuantidadeEstoque(), media);
                })
                .filter(dto -> dto.getSugestaoCompra() > 0)
                .sorted((a, b) -> a.getDiasRestantes().compareTo(b.getDiasRestantes()))
                .collect(Collectors.toList());
    }
}