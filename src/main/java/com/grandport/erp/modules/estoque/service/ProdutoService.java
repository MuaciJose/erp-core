package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
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

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProdutoService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private NcmRepository ncmRepository;
    @Autowired private MovimentacaoEstoqueRepository movimentacaoRepository;
    @Autowired private AuditoriaService auditoriaService;

    @Transactional
    public Produto cadastrar(ProdutoRequestDTO dto, String imagePath) {
        Marca marca = marcaRepository.findById(dto.marcaId())
                .orElseThrow(() -> new RuntimeException("Erro: Marca ID " + dto.marcaId() + " não encontrada."));
        Ncm ncm = ncmRepository.findById(dto.ncmCodigo())
                .orElseThrow(() -> new RuntimeException("Erro: NCM " + dto.ncmCodigo() + " não cadastrado no sistema."));

        Produto produto = new Produto();
        updateProdutoFromDto(produto, dto, marca, ncm, imagePath);

        Produto salvo = produtoRepository.save(produto);
        registrarMovimentacao(salvo, dto.quantidadeEstoque(), "ENTRADA", "Cadastro Inicial");
        
        auditoriaService.registrar("ESTOQUE", "CRIACAO", "Cadastrou o produto: " + salvo.getNome());
        
        return salvo;
    }

    @Transactional
    public Produto atualizar(Long id, ProdutoRequestDTO dto, String imagePath) {
        Produto produto = findById(id);
        Marca marca = marcaRepository.findById(dto.marcaId())
                .orElseThrow(() -> new RuntimeException("Marca não encontrada."));
        Ncm ncm = ncmRepository.findById(dto.ncmCodigo())
                .orElseThrow(() -> new RuntimeException("NCM não encontrado."));

        updateProdutoFromDto(produto, dto, marca, ncm, imagePath);
        
        Produto salvo = produtoRepository.save(produto);
        auditoriaService.registrar("ESTOQUE", "EDICAO", "Atualizou o produto: " + salvo.getNome());
        
        return salvo;
    }

    private void updateProdutoFromDto(Produto p, ProdutoRequestDTO dto, Marca marca, Ncm ncm, String imagePath) {
        p.setSku(dto.sku());
        p.setNome(dto.nome());
        p.setDescricao(dto.descricao());
        p.setAplicacao(dto.aplicacao());
        p.setCodigoBarras(dto.codigoBarras());
        p.setPrecoCusto(dto.precoCusto());
        p.setPrecoVenda(dto.precoVenda());
        p.setEstoqueMinimo(dto.estoqueMinimo());
        p.setMarca(marca);
        p.setNcm(ncm);
        p.setFotoUrl(dto.fotoUrl());
        if (imagePath != null) {
            p.setFotoLocalPath("/uploads/produtos/" + imagePath);
        }
        // Quantidade de estoque não é alterada aqui por segurança (use ajuste-estoque)
        if (p.getId() == null) {
            p.setQuantidadeEstoque(dto.quantidadeEstoque());
        }
    }

    @Transactional
    public void atualizarPrecos(List<AtualizarPrecoRequestDTO> precos) {
        for (AtualizarPrecoRequestDTO dto : precos) {
            Produto produto = findById(dto.getId());
            BigDecimal precoAntigo = produto.getPrecoVenda();
            produto.setPrecoVenda(dto.getNovoPrecoVenda());
            produtoRepository.save(produto);
            
            auditoriaService.registrar("ESTOQUE", "ALTERACAO_PRECO", "Alterou preço de " + produto.getNome() + ": R$ " + precoAntigo + " -> R$ " + dto.getNovoPrecoVenda());
        }
    }

    @Transactional
    public void deleteProduto(Long id) {
        Produto p = findById(id);
        produtoRepository.deleteById(id);
        auditoriaService.registrar("ESTOQUE", "EXCLUSAO", "Excluiu o produto: " + p.getNome());
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
        registrarMovimentacao(salvo, Math.abs(diferenca), tipo, motivo);

        auditoriaService.registrar("ESTOQUE", "AJUSTE", "Ajustou estoque de " + produto.getNome() + ": " + saldoAnterior + " -> " + novaQuantidade + ". Motivo: " + motivo);

        return salvo;
    }

    private void registrarMovimentacao(Produto produto, Integer quantidade, String tipo, String motivo) {
        MovimentacaoEstoque mov = new MovimentacaoEstoque();
        mov.setProduto(produto);
        mov.setQuantidade(quantidade);
        mov.setTipo(tipo);
        mov.setMotivo(motivo);
        mov.setSaldoAnterior(produto.getQuantidadeEstoque() - (tipo.equals("ENTRADA") ? quantidade : -quantidade));
        mov.setSaldoAtual(produto.getQuantidadeEstoque());
        movimentacaoRepository.save(mov);
    }
}
