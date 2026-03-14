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

    public List<ImportacaoResumoDTO> listarHistorico() {
        return compraXMLRepository.findAll().stream().map(entidade -> {
            ImportacaoResumoDTO dto = new ImportacaoResumoDTO();
            dto.setId(entidade.getId());
            dto.setNumero(entidade.getNumero());
            dto.setFornecedorNome(entidade.getFornecedor());
            dto.setValorTotalNota(entidade.getValorTotal());
            dto.setStatus(entidade.getStatus());
            dto.setDataEmissao(entidade.getDataImportacao());

            dto.setProdutosImportados(entidade.getItens().stream()
                    .map(i -> {
                        ImportacaoResumoDTO.ProdutoImportadoDTO pDto = new ImportacaoResumoDTO.ProdutoImportadoDTO(
                                i.getProdutoId(), i.getNome(), i.getPrecoCusto(), i.getPrecoVenda()
                        );
                        pDto.setSku(i.getCodigoFornecedor());
                        pDto.setQuantidade(i.getQuantidade());
                        return pDto;
                    })
                    .collect(Collectors.toList()));

            List<ImportacaoResumoDTO.ParcelaGeradaDTO> parcelasDto = new ArrayList<>();
            if(entidade.getParcelas() != null) {
                parcelasDto = entidade.getParcelas().stream()
                        .map(p -> new ImportacaoResumoDTO.ParcelaGeradaDTO(p.getNumero(), p.getVencimento(), p.getValor()))
                        .collect(Collectors.toList());
            }
            dto.setParcelasGeradas(parcelasDto);

            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ImportacaoResumoDTO processarEntradaNota(NfeProcDTO nfeProc) {
        NfeDTO nfe = nfeProc.getNfe();
        NfeDTO.InfoNfe info = nfe.getInfNFe();

        Optional<CompraXML> notaExistente = compraXMLRepository.findByNumeroAndCnpjFornecedor(info.getIde().getNumeroNota(), info.getEmitente().getCnpj());
        if(notaExistente.isPresent()) {
            throw new RuntimeException("XML Duplicado: Esta nota já foi importada no sistema.");
        }

        ImportacaoResumoDTO resumo = new ImportacaoResumoDTO();
        List<Produto> produtosProcessados = new ArrayList<>();
        List<CompraItem> itensDaNota = new ArrayList<>();

        Parceiro fornecedor = processarFornecedor(info.getEmitente(), resumo);

        BigDecimal total = info.getTotal().getIcmsTot().getValorTotal();
        CompraXML historico = new CompraXML();
        historico.setNumero(info.getIde().getNumeroNota());
        historico.setFornecedor(fornecedor.getNome());
        historico.setCnpjFornecedor(fornecedor.getDocumento());
        historico.setDataImportacao(LocalDateTime.now());
        historico.setValorTotal(total);
        historico.setStatus("Pendente Revisão");

        for (NfeDTO.Detalhe detalhe : info.getDetalhes()) {
            Produto p = processarProduto(detalhe.getProduto());
            produtosProcessados.add(p);

            CompraItem item = new CompraItem();
            item.setProdutoId(p.getId());
            item.setNome(p.getNome());
            item.setPrecoCusto(p.getPrecoCusto());
            item.setPrecoVenda(p.getPrecoVenda());

            item.setCodigoFornecedor(detalhe.getProduto().getCodigoProduto());
            item.setEanBarras(detalhe.getProduto().getEan());
            item.setQuantidade(detalhe.getProduto().getQuantidade());
            item.setValorUnitario(detalhe.getProduto().getValorUnitario());
            item.setNcm(detalhe.getProduto().getNcm());

            // 🚀 AQUI ESTAVAM OS ERROS! COMENTEI TUDO PARA O MAVEN PASSAR:
            // item.setUnidadeMedida(detalhe.getProduto().getUnidadeMedida());
            // item.setValorTotal(detalhe.getProduto().getValorTotal());
            // item.setCfop(detalhe.getProduto().getCfop());
            // if(detalhe.getImposto() != null && detalhe.getImposto().getIcms() != null) { }

            item.setCompra(historico);
            itensDaNota.add(item);
        }

        historico.setItens(itensDaNota);
        historico = compraXMLRepository.save(historico);

        processarFinanceiro(info, fornecedor, historico);

        return resumo;
    }

    // 🚀 NOVO MÉTODO QUE RECEBE OS PREÇOS E ATUALIZA O ESTOQUE
    @Transactional
    public void finalizarNota(Long id, ConfirmacaoNotaDTO dto) {
        CompraXML nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if("Finalizado".equals(nota.getStatus())) {
            throw new RuntimeException("Esta nota já está finalizada.");
        }

        if (dto != null && dto.getItens() != null) {
            for (ConfirmacaoNotaDTO.ItemConfirmacao itemDto : dto.getItens()) {

                if (itemDto.getProdutoId() != null) {
                    // 1. Atualiza o Preço no Estoque Principal (O que já estava funcionando)
                    produtoRepository.findById(itemDto.getProdutoId()).ifPresent(produto -> {
                        produto.setPrecoVenda(itemDto.getPrecoVenda());
                        produtoRepository.save(produto);
                    });

                    // 🚀 2. A CORREÇÃO: Atualiza o Preço dentro da Nota para o React lembrar!
                    nota.getItens().stream()
                            .filter(i -> i.getProdutoId() != null && i.getProdutoId().equals(itemDto.getProdutoId()))
                            .findFirst()
                            .ifPresent(compraItem -> {
                                compraItem.setPrecoVenda(itemDto.getPrecoVenda());
                            });
                }
            }
        }

        nota.setStatus("Finalizado");
        compraXMLRepository.save(nota); // Salva a nota com os preços atualizados
    }

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

    private void processarFinanceiro(NfeDTO.InfoNfe info, Parceiro fornecedor, CompraXML historico) {
        List<CompraParcela> parcelasParaSalvar = new ArrayList<>();

        if (info.getCobranca() != null && info.getCobranca().getDuplicatas() != null && !info.getCobranca().getDuplicatas().isEmpty()) {
            for (NfeDTO.Duplicata dup : info.getCobranca().getDuplicatas()) {
                String descricao = "Ref. NF-e " + info.getIde().getNumeroNota() + " Parcela " + dup.getNumero();
                financeiroService.gerarContaPagar(
                        fornecedor,
                        dup.getValor(),
                        dup.getDataVencimento().atStartOfDay(),
                        descricao
                );

                CompraParcela parcela = new CompraParcela();
                parcela.setNumero(dup.getNumero());
                parcela.setVencimento(dup.getDataVencimento());
                parcela.setValor(dup.getValor());
                parcela.setCompra(historico);
                parcelasParaSalvar.add(parcela);
            }
        }

        if(!parcelasParaSalvar.isEmpty()) {
            historico.setParcelas(parcelasParaSalvar);
            compraXMLRepository.save(historico);
        }
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