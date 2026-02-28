package com.grandport.erp.modules.compras.service;

import com.grandport.erp.modules.compras.dto.ItemNotaDTO;
import com.grandport.erp.modules.compras.dto.NfeDTO;
import com.grandport.erp.modules.compras.dto.NfeProcDTO;
import com.grandport.erp.modules.estoque.model.Marca;
import com.grandport.erp.modules.estoque.model.Ncm;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.MarcaRepository;
import com.grandport.erp.modules.estoque.repository.NcmRepository;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class CompraService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private FinanceiroService financeiroService;
    @Autowired private NcmRepository ncmRepository;
    @Autowired private MarcaRepository marcaRepository;

    @Transactional
    public void processarEntradaNota(NfeProcDTO nfeProc) {
        NfeDTO nfe = nfeProc.getNfe();

        for (NfeDTO.Detalhe detalhe : nfe.getInfNFe().getDetalhes()) {
            ItemNotaDTO item = detalhe.getProduto();

            Produto produto = produtoRepository.findByCodigoBarras(item.getEan())
                .orElseGet(() -> criarNovoProdutoPelaNota(item));

            // Converte a quantidade de BigDecimal para Integer
            int quantidadeEntrada = item.getQuantidade().intValue();
            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() + quantidadeEntrada);
            
            produto.setPrecoCusto(item.getValorUnitario());
            produtoRepository.save(produto);
        }

        financeiroService.gerarContaPagar(
            nfe.getInfNFe().getEmitente().getNomeFornecedor(),
            nfe.getInfNFe().getTotal().getIcmsTot().getValorTotal(),
            nfe.getInfNFe().getIde().getDataEmissao().toLocalDateTime()
        );
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
