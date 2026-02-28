package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.estoque.dto.AtualizarPrecoRequestDTO;
import com.grandport.erp.modules.estoque.dto.ProdutoRequestDTO;
import com.grandport.erp.modules.estoque.model.Marca;
import com.grandport.erp.modules.estoque.model.MovimentacaoEstoque;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MarcaRepository;
import com.grandport.erp.modules.estoque.repository.MovimentacaoEstoqueRepository;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProdutoService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private NcmRepository ncmRepository;
    @Autowired private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Transactional
    public Produto cadastrar(ProdutoRequestDTO dto, String imagePath) {
        Marca marca = marcaRepository.findById(dto.marcaId())
                .orElseThrow(() -> new RuntimeException("Erro: Marca ID " + dto.marcaId() + " não encontrada."));
        Ncm ncm = ncmRepository.findById(dto.ncmCodigo())
                .orElseThrow(() -> new RuntimeException("Erro: NCM " + dto.ncmCodigo() + " não cadastrado no sistema."));

        Produto produto = new Produto();
        produto.setSku(dto.sku());
        produto.setNome(dto.nome());
        produto.setDescricao(dto.descricao());
        produto.setAplicacao(dto.aplicacao());
        produto.setCodigoBarras(dto.codigoBarras());
        produto.setPrecoCusto(dto.precoCusto());
        produto.setPrecoVenda(dto.precoVenda());
        produto.setQuantidadeEstoque(dto.quantidadeEstoque());
        produto.setEstoqueMinimo(dto.estoqueMinimo());
        produto.setMarca(marca);
        produto.setNcm(ncm);
        produto.setFotoUrl(dto.fotoUrl());
        if (imagePath != null) {
            produto.setFotoLocalPath("/uploads/produtos/" + imagePath);
        }

        Produto salvo = produtoRepository.save(produto);
        registrarMovimentacao(salvo, dto.quantidadeEstoque(), "ENTRADA", "Cadastro Inicial");
        return salvo;
    }

    @Transactional
    public void atualizarPrecos(List<AtualizarPrecoRequestDTO> precos) {
        for (AtualizarPrecoRequestDTO dto : precos) {
            Produto produto = findById(dto.getId());
            produto.setPrecoVenda(dto.getNovoPrecoVenda());
            produtoRepository.save(produto);
        }
    }

    @Transactional
    public void deleteProduto(Long id) {
        // Adicionar validações aqui se necessário (ex: não deletar se houver estoque)
        produtoRepository.deleteById(id);
    }

    public List<Produto> listarAlertasEstoque() {
        return produtoRepository.findAlertasEstoque();
    }

    public List<Produto> buscarProdutos(String termo) {
        return produtoRepository.buscarPorTermo(termo);
    }

    public Produto findById(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: ID " + id));
    }

    @Transactional
    public Produto atualizarEstoque(Long id, Integer novaQuantidade, String motivo) {
        Produto produto = findById(id);
        Integer saldoAnterior = produto.getQuantidadeEstoque();
        Integer diferenca = novaQuantidade - saldoAnterior;
        
        produto.setQuantidadeEstoque(novaQuantidade);
        Produto salvo = produtoRepository.save(produto);

        String tipo = diferenca > 0 ? "ENTRADA" : "SAIDA";
        registrarMovimentacao(salvo, diferenca, tipo, motivo);

        return salvo;
    }

    private void registrarMovimentacao(Produto produto, Integer quantidade, String tipo, String motivo) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setQuantidade(quantidade);
        mov.setTipo(tipo);
        mov.setMotivo(motivo);
        mov.setSaldoAnterior(produto.getQuantidadeEstoque() - quantidade);
        mov.setSaldoAtual(produto.getQuantidadeEstoque());
        movimentacaoRepository.save(mov);
    }
}
