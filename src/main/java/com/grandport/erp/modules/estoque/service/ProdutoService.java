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
        // 🚀 BLINDAGEM: Se vier nulo, ele não quebra, ele apenas deixa a variável "null"
        Marca marca = null;
        if (dto.marcaId() != null) {
            marca = marcaRepository.findById(dto.marcaId()).orElse(null);
        }

        Ncm ncm = null;
        if (dto.ncmCodigo() != null && !dto.ncmCodigo().trim().isEmpty()) {
            ncm = ncmRepository.findById(dto.ncmCodigo()).orElse(null);
        }

        Produto produto = new Produto();
        updateProdutoFromDto(produto, dto, marca, ncm, imagePath);

        Produto salvo = produtoRepository.save(produto);

        // Proteção extra caso a quantidade venha nula do React
        registrarMovimentacao(salvo, dto.quantidadeEstoque() != null ? dto.quantidadeEstoque() : 0, "ENTRADA", "Cadastro Inicial");

        auditoriaService.registrar("ESTOQUE", "CRIACAO", "Cadastrou o produto: " + salvo.getNome());

        return salvo;
    }

    @Transactional
    public Produto atualizar(Long id, ProdutoRequestDTO dto, String imagePath) {
        Produto produto = findById(id);

        // 🚀 BLINDAGEM NA EDIÇÃO TAMBÉM
        Marca marca = null;
        if (dto.marcaId() != null) {
            marca = marcaRepository.findById(dto.marcaId()).orElse(null);
        }

        Ncm ncm = null;
        if (dto.ncmCodigo() != null && !dto.ncmCodigo().trim().isEmpty()) {
            ncm = ncmRepository.findById(dto.ncmCodigo()).orElse(null);
        }

        updateProdutoFromDto(produto, dto, marca, ncm, imagePath);

        Produto salvo = produtoRepository.save(produto);
        auditoriaService.registrar("ESTOQUE", "EDICAO", "Atualizou o produto: " + salvo.getNome());

        return salvo;
    }

    // 🚀 O MOTOR QUE CONECTA O DTO COM O BANCO DE DADOS (AGORA COM FISCAL)
    private void updateProdutoFromDto(Produto p, ProdutoRequestDTO dto, Marca marca, Ncm ncm, String imagePath) {
        // Dados Básicos
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

        // 🚀 DADOS FISCAIS
        p.setCest(dto.cest());
        p.setOrigemMercadoria(dto.origemMercadoria() != null ? dto.origemMercadoria() : 0);
        p.setCfopPadrao(dto.cfopPadrao() != null ? dto.cfopPadrao() : "5102");
        p.setCsosnPadrao(dto.csosnPadrao() != null ? dto.csosnPadrao() : "102");
        p.setCstPadrao(dto.cstPadrao() != null ? dto.cstPadrao() : "00");
        p.setCstIcms(dto.cstIcms());
        p.setCstPisCofins(dto.cstPisCofins());
        p.setCstIpi(dto.cstIpi());

        // Tratamento seguro para as alíquotas numéricas
        p.setAliquotaIcms(dto.aliquotaIcms() != null ? dto.aliquotaIcms() : BigDecimal.ZERO);
        p.setAliquotaIpi(dto.aliquotaIpi() != null ? dto.aliquotaIpi() : BigDecimal.ZERO);
        p.setAliquotaPis(dto.aliquotaPis() != null ? dto.aliquotaPis() : BigDecimal.ZERO);
        p.setAliquotaCofins(dto.aliquotaCofins() != null ? dto.aliquotaCofins() : BigDecimal.ZERO);

        // Uploads e Estoque Incial
        if (imagePath != null) {
            p.setFotoLocalPath("/uploads/produtos/" + imagePath);
        }
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