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

    // Motor de Auditoria já estava injetado perfeitamente!
    @Autowired private AuditoriaService auditoriaService;

    @Transactional
    public Produto cadastrar(ProdutoRequestDTO dto, String imagePath) {
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

        registrarMovimentacao(salvo, dto.quantidadeEstoque() != null ? dto.quantidadeEstoque() : 0, "ENTRADA", "Cadastro Inicial");

        // 🚀 AUDITORIA: Enriquecida com SKU
        String skuInfo = salvo.getSku() != null ? salvo.getSku() : "Sem SKU";
        auditoriaService.registrar("ESTOQUE", "CRIACAO_PRODUTO", "Cadastrou o produto: " + salvo.getNome() + " (SKU: " + skuInfo + " | ID: " + salvo.getId() + ")");

        return salvo;
    }

    @Transactional
    public Produto atualizar(Long id, ProdutoRequestDTO dto, String imagePath) {
        Produto produto = findById(id);

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

        // 🚀 AUDITORIA: Enriquecida com SKU
        String skuInfo = salvo.getSku() != null ? salvo.getSku() : "Sem SKU";
        auditoriaService.registrar("ESTOQUE", "EDICAO_PRODUTO", "Atualizou o cadastro do produto: " + salvo.getNome() + " (SKU: " + skuInfo + ")");

        return salvo;
    }

    // 🚀 O MOTOR COMPLETO: OPERACIONAL + FISCAL + FÍSICO (Nenhuma vírgula alterada aqui)
    private void updateProdutoFromDto(Produto p, ProdutoRequestDTO dto, Marca marca, Ncm ncm, String imagePath) {
        // 1. Dados Básicos e Identificação
        p.setSku(dto.sku());
        p.setNome(dto.nome());
        p.setDescricao(dto.descricao());
        p.setAplicacao(dto.aplicacao());
        p.setCodigoBarras(dto.codigoBarras());
        p.setReferenciaOriginal(dto.referenciaOriginal());
        p.setMarca(marca);
        p.setAtivo(dto.ativo() != null ? dto.ativo() : true);
        p.setFotoUrl(dto.fotoUrl());

        if (imagePath != null) {
            p.setFotoLocalPath("/uploads/produtos/" + imagePath);
        }

        // 2. Precificação Financeira
        p.setPrecoCusto(dto.precoCusto());
        p.setPrecoVenda(dto.precoVenda());
        p.setMargemLucro(dto.margemLucro() != null ? dto.margemLucro() : BigDecimal.ZERO);
        p.setPrecoMinimo(dto.precoMinimo() != null ? dto.precoMinimo() : BigDecimal.ZERO);
        p.setComissao(dto.comissao() != null ? dto.comissao() : BigDecimal.ZERO);

        // 3. Estoque e Logística
        p.setUnidadeMedida(dto.unidadeMedida() != null ? dto.unidadeMedida() : "UN");
        p.setEstoqueMinimo(dto.estoqueMinimo() != null ? dto.estoqueMinimo() : 0);
        p.setEstoqueMaximo(dto.estoqueMaximo() != null ? dto.estoqueMaximo() : 0);
        p.setPermitirEstoqueNegativo(dto.permitirEstoqueNegativo() != null ? dto.permitirEstoqueNegativo() : false);
        p.setLocalizacao(dto.localizacao());

        if (p.getId() == null) {
            p.setQuantidadeEstoque(dto.quantidadeEstoque() != null ? dto.quantidadeEstoque() : 0);
        }

        p.setPesoLiquido(dto.pesoLiquido() != null ? dto.pesoLiquido() : BigDecimal.ZERO);
        p.setPesoBruto(dto.pesoBruto() != null ? dto.pesoBruto() : BigDecimal.ZERO);

        // 4. Dados Fiscais e Impostos (100% Sincronizado)
        p.setNcm(ncm);
        p.setCest(dto.cest());
        p.setOrigemMercadoria(dto.origemMercadoria() != null ? dto.origemMercadoria() : 0);
        p.setCfopPadrao(dto.cfopPadrao() != null ? dto.cfopPadrao() : "5102");
        p.setCsosnPadrao(dto.csosnPadrao() != null ? dto.csosnPadrao() : "102");
        p.setCstPadrao(dto.cstPadrao() != null ? dto.cstPadrao() : "00");
        p.setCstIcms(dto.cstIcms());
        p.setCstPisCofins(dto.cstPisCofins());
        p.setCstIpi(dto.cstIpi());

        p.setAliquotaIcms(dto.aliquotaIcms() != null ? dto.aliquotaIcms() : BigDecimal.ZERO);
        p.setAliquotaIpi(dto.aliquotaIpi() != null ? dto.aliquotaIpi() : BigDecimal.ZERO);
        p.setAliquotaPis(dto.aliquotaPis() != null ? dto.aliquotaPis() : BigDecimal.ZERO);
        p.setAliquotaCofins(dto.aliquotaCofins() != null ? dto.aliquotaCofins() : BigDecimal.ZERO);
    }

    @Transactional
    public void atualizarPrecos(List<AtualizarPrecoRequestDTO> precos) {
        for (AtualizarPrecoRequestDTO dto : precos) {
            Produto produto = findById(dto.getId());
            BigDecimal precoAntigo = produto.getPrecoVenda();
            produto.setPrecoVenda(dto.getNovoPrecoVenda());
            produtoRepository.save(produto);

            // 🚀 AUDITORIA: Registro claro de mudança em lote
            auditoriaService.registrar("ESTOQUE", "ALTERACAO_PRECO", "Alterou preço do produto '" + produto.getNome() + "' (ID: " + produto.getId() + ") de R$ " + precoAntigo + " para R$ " + dto.getNovoPrecoVenda());
        }
    }

    @Transactional
    public void deleteProduto(Long id) {
        Produto p = findById(id);
        String nome = p.getNome();
        String sku = p.getSku() != null ? p.getSku() : "Sem SKU";

        produtoRepository.deleteById(id);

        // 🚀 AUDITORIA: Guarda o nome antes de deletar!
        auditoriaService.registrar("ESTOQUE", "EXCLUSAO_PRODUTO", "Excluiu definitivamente o produto: " + nome + " (SKU: " + sku + ")");
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

        // 🚀 AUDITORIA: Perfeitamente implementada por você, apenas adicionei o nome da ação padrão
        auditoriaService.registrar("ESTOQUE", "AJUSTE_MANUAL_ESTOQUE", "Ajustou estoque de '" + produto.getNome() + "': " + saldoAnterior + " -> " + novaQuantidade + ". Motivo: " + motivo);

        return salvo;
    }

    // Método privado auxiliar
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