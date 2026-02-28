package com.grandport.erp.modules.compras.service;

import com.grandport.erp.modules.compras.dto.ImportacaoResumoDTO;
import com.grandport.erp.modules.compras.dto.ItemNotaDTO;
import com.grandport.erp.modules.compras.dto.NfeDTO;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.estoque.model.Marca;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MarcaRepository;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.model.TipoParceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CompraService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private NcmRepository ncmRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private FinanceiroService financeiroService;

    @Transactional
    public ImportacaoResumoDTO processarEntradaNota(NfeProcDTO nfeProc) {
        NfeDTO nfe = nfeProc.getNfe();
        NfeDTO.InfoNfe info = nfe.getInfNFe();
        
        ImportacaoResumoDTO resumo = new ImportacaoResumoDTO();
        List<Produto> produtosProcessados = new ArrayList<>();

        Parceiro fornecedor = processarFornecedor(info.getEmitente(), resumo);

        for (NfeDTO.Detalhe detalhe : info.getDetalhes()) {
            Produto p = processarProduto(detalhe.getProduto());
            produtosProcessados.add(p);
        }
        
        resumo.setProdutosImportados(produtosProcessados.stream()
            .map(p -> new ImportacaoResumoDTO.ProdutoImportadoDTO(p.getId(), p.getNome(), p.getPrecoCusto(), p.getPrecoVenda()))
            .collect(Collectors.toList()));
        resumo.setQuantidadeProdutosCadastrados(info.getDetalhes().size());

        List<ContaPagar> contas = processarFinanceiro(info, fornecedor);
        resumo.setParcelasGeradas(contas);
        resumo.setValorTotalNota(info.getTotal().getIcmsTot().getValorTotal());

        return resumo;
    }

    private Parceiro processarFornecedor(NfeDTO.Emitente emitente, ImportacaoResumoDTO resumo) {
        Optional<Parceiro> fornecedorExistente = parceiroRepository.findByDocumento(emitente.getCnpj());
        
        final boolean isNew;
        Parceiro fornecedor;

        if (fornecedorExistente.isPresent()) {
            fornecedor = fornecedorExistente.get();
            isNew = false;
        } else {
            fornecedor = new Parceiro();
            fornecedor.setNome(emitente.getNome());
            fornecedor.setDocumento(emitente.getCnpj());
            fornecedor.setTipo(TipoParceiro.FORNECEDOR);
            parceiroRepository.save(fornecedor);
            isNew = true;
        }
        
        resumo.setFornecedor(new ImportacaoResumoDTO.FornecedorResumoDTO(fornecedor, isNew));
        return fornecedor;
    }

    private Produto processarProduto(ItemNotaDTO item) {
        Produto produto = produtoRepository.findByCodigoBarras(item.getEan())
            .orElseGet(() -> criarNovoProdutoPelaNota(item));

        int quantidadeEntrada = item.getQuantidade().intValue();
        produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() + quantidadeEntrada);
        produto.setPrecoCusto(item.getValorUnitario());
        return produtoRepository.save(produto);
    }

    private List<ContaPagar> processarFinanceiro(NfeDTO.InfoNfe info, Parceiro fornecedor) {
        List<ContaPagar> contasGeradas = new ArrayList<>();
        if (info.getCobranca() != null && info.getCobranca().getDuplicatas() != null) {
            for (NfeDTO.Duplicata dup : info.getCobranca().getDuplicatas()) {
                String descricao = "Ref. NF-e " + info.getIde().getNumeroNota() + " Parcela " + dup.getNumero();
                ContaPagar contaSalva = financeiroService.gerarContaPagar(
                    fornecedor, 
                    dup.getValor(), 
                    dup.getDataVencimento().atStartOfDay(), 
                    descricao
                );
                contasGeradas.add(contaSalva);
            }
        }
        return contasGeradas;
    }

    private Produto criarNovoProdutoPelaNota(ItemNotaDTO item) {
        Produto novo = new Produto();
        novo.setNome(item.getNomeProduto());
        novo.setSku(item.getCodigoProduto());
        novo.setCodigoBarras(item.getEan());
        novo.setPrecoCusto(item.getValorUnitario());
        novo.setQuantidadeEstoque(0);
        novo.setPrecoVenda(item.getValorUnitario().multiply(new BigDecimal("1.40")));

        Ncm ncm = ncmRepository.findById(item.getNcm())
                .orElseGet(() -> {
                    Ncm novoNcm = new Ncm();
                    novoNcm.setCodigo(item.getNcm());
                    novoNcm.setDescricao("Importado via XML");
                    return ncmRepository.save(novoNcm);
                });
        novo.setNcm(ncm);

        Marca marca = marcaRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Marca novaMarca = new Marca();
                    novaMarca.setNome("GENÉRICA");
                    return marcaRepository.save(novaMarca);
                });
        novo.setMarca(marca);

        return novo;
    }
}
