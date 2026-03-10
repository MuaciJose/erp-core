package com.grandport.erp.modules.compras.service;

import com.grandport.erp.modules.compras.dto.*;
import com.grandport.erp.modules.compras.model.*;
import com.grandport.erp.modules.compras.repository.CompraXMLRepository;
import com.grandport.erp.modules.estoque.model.*;
import com.grandport.erp.modules.estoque.repository.*;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.parceiro.model.*;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    @Autowired private CompraXMLRepository compraXMLRepository;

    /**
     * Retorna o histórico de notas para a tabela do React.
     */
    public List<ImportacaoResumoDTO> listarHistorico() {
        return compraXMLRepository.findAll().stream().map(entidade -> {
            ImportacaoResumoDTO dto = new ImportacaoResumoDTO();
            dto.setId(entidade.getId());
            dto.setNumero(entidade.getNumero());
            dto.setFornecedorNome(entidade.getFornecedor());
            dto.setValorTotalNota(entidade.getValorTotal());
            dto.setStatus(entidade.getStatus());

            // Carrega os itens para o espelho
            dto.setProdutosImportados(entidade.getItens().stream()
                    .map(i -> new ImportacaoResumoDTO.ProdutoImportadoDTO(
                            i.getProdutoId(), i.getNome(), i.getPrecoCusto(), i.getPrecoVenda()))
                    .collect(Collectors.toList()));

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Processa o XML e salva no banco com status "Pendente Revisão".
     */
    @Transactional
    public ImportacaoResumoDTO processarEntradaNota(NfeProcDTO nfeProc) {
        NfeDTO nfe = nfeProc.getNfe();
        NfeDTO.InfoNfe info = nfe.getInfNFe();

        ImportacaoResumoDTO resumo = new ImportacaoResumoDTO();
        List<Produto> produtosProcessados = new ArrayList<>();

        // 1. Processar Fornecedor
        Parceiro fornecedor = processarFornecedor(info.getEmitente(), resumo);

        // 2. Processar Itens
        for (NfeDTO.Detalhe detalhe : info.getDetalhes()) {
            Produto p = processarProduto(detalhe.getProduto());
            produtosProcessados.add(p);
        }

        BigDecimal total = info.getTotal().getIcmsTot().getValorTotal();

        // 3. Salvar Histórico Principal
        CompraXML historico = new CompraXML();
        historico.setNumero(info.getIde().getNumeroNota());
        historico.setFornecedor(fornecedor.getNome());
        historico.setCnpjFornecedor(fornecedor.getDocumento());
        historico.setDataImportacao(LocalDateTime.now());
        historico.setValorTotal(total);
        historico.setStatus("Pendente Revisão");

        // 4. Salvar Itens do Histórico (vínculo com CompraXML)
        List<CompraItem> itens = produtosProcessados.stream().map(p -> {
            CompraItem item = new CompraItem();
            item.setProdutoId(p.getId());
            item.setNome(p.getNome());
            item.setPrecoCusto(p.getPrecoCusto());
            item.setPrecoVenda(p.getPrecoVenda());
            item.setCompra(historico);
            return item;
        }).collect(Collectors.toList());

        historico.setItens(itens);
        compraXMLRepository.save(historico);

        // 5. Gerar Financeiro
        processarFinanceiro(info, fornecedor);

        return resumo;
    }

    /**
     * Trava a nota como "Finalizado" para impedir novas edições de preço.
     */
    public void finalizarNota(Long id) {
        CompraXML nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));
        nota.setStatus("Finalizado");
        compraXMLRepository.save(nota);
    }

    // --- MÉTODOS PRIVADOS DE PROCESSAMENTO ---

    private Parceiro processarFornecedor(NfeDTO.Emitente emitente, ImportacaoResumoDTO resumo) {
        Optional<Parceiro> fornecedorExistente = parceiroRepository.findByDocumento(emitente.getCnpj());
        Parceiro fornecedor;
        boolean isNew;

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

    public void excluirImportacao(Long id) {
        compraXMLRepository.deleteById(id);
    }
}