package com.grandport.erp.modules.compras.service;

import com.grandport.erp.modules.compras.dto.*;
import com.grandport.erp.modules.compras.model.*;
import com.grandport.erp.modules.compras.repository.CompraXMLRepository;
import com.grandport.erp.modules.estoque.model.*;
import com.grandport.erp.modules.estoque.repository.*;
import com.grandport.erp.modules.estoque.service.EstoqueService;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.parceiro.model.*;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
// 🚀 1. IMPORTAÇÃO DA AUDITORIA
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
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
    @Autowired private EmpresaContextService empresaContextService;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private FinanceiroService financeiroService;
    @Autowired private CompraXMLRepository compraXMLRepository;
    @Autowired private EstoqueService estoqueService;

    // 🚀 2. INJEÇÃO DO MOTOR DE AUDITORIA
    @Autowired private AuditoriaService auditoriaService;

    public List<ImportacaoResumoDTO> listarHistorico() {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        return compraXMLRepository.findAllByEmpresaIdOrderByDataImportacaoDesc(empresaId).stream().map(entidade -> {
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
                        pDto.setId(i.getId());
                        pDto.setSku(i.getCodigoFornecedor());
                        pDto.setQuantidade(i.getQuantidade());
                        pDto.setEstoqueAtual(0);

                        if (i.getProdutoId() != null) {
                            produtoRepository.findById(i.getProdutoId()).ifPresent(prod -> {
                                pDto.setNome(prod.getNome());
                                pDto.setEstoqueAtual(prod.getQuantidadeEstoque());
                            });
                        }

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

        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Optional<CompraXML> notaExistente = compraXMLRepository.findByEmpresaIdAndNumeroAndCnpjFornecedor(empresaId, info.getIde().getNumeroNota(), info.getEmitente().getCnpj());
        if(notaExistente.isPresent()) {
            throw new RuntimeException("XML Duplicado: Esta nota já foi importada no sistema.");
        }

        ImportacaoResumoDTO resumo = new ImportacaoResumoDTO();
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
        historico.setEmpresaId(empresaId);

        for (NfeDTO.Detalhe detalhe : info.getDetalhes()) {
            ItemNotaDTO itemXml = detalhe.getProduto();

            Optional<Produto> prodOpt = Optional.empty();
            String codigoEan = itemXml.getEan();
            String codigoFornecedor = itemXml.getCodigoProduto();

            if (codigoEan != null && !codigoEan.equalsIgnoreCase("SEM GTIN") && !codigoEan.trim().isEmpty()) {
                try {
                    prodOpt = produtoRepository.findByCodigoBarrasAndEmpresa(codigoEan, empresaContextService.getRequiredEmpresaId());
                } catch (Exception e) {}
            }

            if (prodOpt.isEmpty() && codigoFornecedor != null && !codigoFornecedor.trim().isEmpty()) {
                try {
                    prodOpt = produtoRepository.findBySkuAndEmpresa(codigoFornecedor, empresaContextService.getRequiredEmpresaId());
                } catch (Exception e) {}
            }

            CompraItem item = new CompraItem();
            item.setProdutoId(prodOpt.map(Produto::getId).orElse(null));
            item.setNome(itemXml.getNomeProduto());
            item.setPrecoCusto(itemXml.getValorUnitario());
            item.setCodigoFornecedor(itemXml.getCodigoProduto());
            item.setEanBarras(itemXml.getEan());
            item.setQuantidade(itemXml.getQuantidade());
            item.setValorUnitario(itemXml.getValorUnitario());
            item.setNcm(itemXml.getNcm());
            item.setCompra(historico);

            itensDaNota.add(item);
        }

        historico.setItens(itensDaNota);
        prepararRascunhoFinanceiro(info, historico);

        historico = compraXMLRepository.save(historico);
        final Long idSalvo = historico.getId();

        // 🚀 3. AUDITORIA: Registro de Criação do Rascunho
        auditoriaService.registrar("COMPRAS", "IMPORTACAO_XML", "Rascunho de importação criado: NF-e " + info.getIde().getNumeroNota() + " | Fornecedor: " + fornecedor.getNome());

        return listarHistorico().stream().filter(n -> n.getId().equals(idSalvo)).findFirst().orElse(null);
    }

    @Transactional
    public void finalizarNota(Long id, ConfirmacaoNotaDTO dto) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        CompraXML nota = compraXMLRepository.findByEmpresaIdAndId(empresaId, id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if("Finalizado".equals(nota.getStatus())) {
            throw new RuntimeException("Esta nota já está finalizada.");
        }

        if (dto != null && dto.getItens() != null) {
            for (ConfirmacaoNotaDTO.ItemConfirmacao itemDto : dto.getItens()) {

                CompraItem itemXml = nota.getItens().stream()
                        .filter(i -> i.getId().equals(itemDto.getIdImportacao()))
                        .findFirst().orElseThrow(() -> new RuntimeException("Item do XML não encontrado."));

                Produto produtoFinal;

                if (itemDto.getProdutoId() != null) {
                    produtoFinal = produtoRepository.findById(itemDto.getProdutoId())
                            .orElseThrow(() -> new RuntimeException("Produto vinculado não encontrado no banco."));

                } else {
                    Optional<Produto> prodOpt = Optional.empty();
                    String codigoEan = itemXml.getEanBarras();
                    String skuFornecedor = itemXml.getCodigoFornecedor();

                    if (codigoEan != null && !codigoEan.equalsIgnoreCase("SEM GTIN") && !codigoEan.trim().isEmpty()) {
                        try { prodOpt = produtoRepository.findByCodigoBarrasAndEmpresa(codigoEan, empresaContextService.getRequiredEmpresaId()); } catch (Exception e) {}
                    }
                    if (prodOpt.isEmpty() && skuFornecedor != null && !skuFornecedor.trim().isEmpty()) {
                        try { prodOpt = produtoRepository.findBySkuAndEmpresa(skuFornecedor, empresaContextService.getRequiredEmpresaId()); } catch (Exception e) {}
                    }

                    produtoFinal = prodOpt.orElseGet(() -> criarNovoProdutoPelaNota(itemXml, itemDto.getPrecoVenda()));
                }

                produtoFinal.setPrecoCusto(itemDto.getCustoFinal());
                produtoFinal.setPrecoVenda(itemDto.getPrecoVenda());
                produtoFinal = produtoRepository.save(produtoFinal);

                int quantidadeRealEntrada = itemDto.getQuantidadeFinal().intValue();
                estoqueService.registrarMovimentacao(
                        produtoFinal,
                        quantidadeRealEntrada,
                        "ENTRADA",
                        "Importação NF-e (Fator: " + itemDto.getFatorConversao() + ")",
                        nota.getFornecedor(),
                        nota.getNumero()
                );

                itemXml.setProdutoId(produtoFinal.getId());
                itemXml.setPrecoVenda(itemDto.getPrecoVenda());
            }
        }

        Parceiro fornecedor = parceiroRepository.findByEmpresaIdAndDocumento(empresaContextService.getRequiredEmpresaId(), nota.getCnpjFornecedor())
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        for (CompraParcela parcela : nota.getParcelas()) {
            String descricao = "Ref. NF-e " + nota.getNumero() + " Parcela " + parcela.getNumero();
            financeiroService.gerarContaPagar(
                    fornecedor,
                    parcela.getValor(),
                    parcela.getVencimento().atStartOfDay(),
                    descricao
            );
        }

        // 🚀 4. AUDITORIA: Finalização da Nota e Entrada de Estoque
        auditoriaService.registrar("COMPRAS", "FECHAMENTO_NOTA", "NF-e " + nota.getNumero() + " finalizada. Estoque atualizado (" + dto.getItens().size() + " itens processados) e Contas a Pagar gerado no valor de R$ " + nota.getValorTotal());

        nota.setStatus("Finalizado");
        compraXMLRepository.save(nota);
    }

    private Parceiro processarFornecedor(NfeDTO.Emitente emitente, ImportacaoResumoDTO resumo) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Optional<Parceiro> fornecedorExistente = parceiroRepository.findByEmpresaIdAndDocumento(empresaId, emitente.getCnpj());
        Parceiro fornecedor;
        boolean isNew = false;

        if (fornecedorExistente.isPresent()) {
            fornecedor = fornecedorExistente.get();
        } else {
            fornecedor = new Parceiro();
            fornecedor.setNome(emitente.getNome());
            fornecedor.setDocumento(emitente.getCnpj());
            fornecedor.setTipo(TipoParceiro.FORNECEDOR);
            fornecedor.setEmpresaId(empresaId);
            parceiroRepository.save(fornecedor);
            isNew = true;
        }

        resumo.setFornecedor(new ImportacaoResumoDTO.FornecedorResumoDTO(fornecedor, isNew));
        return fornecedor;
    }

    private void prepararRascunhoFinanceiro(NfeDTO.InfoNfe info, CompraXML historico) {
        List<CompraParcela> parcelasParaSalvar = new ArrayList<>();

        if (info.getCobranca() != null && info.getCobranca().getDuplicatas() != null && !info.getCobranca().getDuplicatas().isEmpty()) {
            for (NfeDTO.Duplicata dup : info.getCobranca().getDuplicatas()) {
                CompraParcela parcela = new CompraParcela();
                parcela.setNumero(dup.getNumero());
                parcela.setVencimento(dup.getDataVencimento());
                parcela.setValor(dup.getValor());
                parcela.setCompra(historico);
                parcelasParaSalvar.add(parcela);
            }
        }
        historico.setParcelas(parcelasParaSalvar);
    }

    private Produto criarNovoProdutoPelaNota(CompraItem item, BigDecimal precoVenda) {
        Produto novo = new Produto();
        novo.setNome(item.getNome());
        novo.setSku(item.getCodigoFornecedor());
        novo.setCodigoBarras(item.getEanBarras());
        novo.setPrecoCusto(item.getPrecoCusto());
        novo.setQuantidadeEstoque(0);
        novo.setPrecoVenda(precoVenda != null ? precoVenda : item.getPrecoCusto().multiply(new BigDecimal("1.40")));

        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Ncm ncm = ncmRepository.findByCodigoAndEmpresaId(item.getNcm(), empresaId)
                .orElseGet(() -> {
                    Ncm novoNcm = new Ncm();
                    novoNcm.setEmpresaId(empresaId);
                    novoNcm.setCodigo(item.getNcm());
                    novoNcm.setDescricao("Importado via XML");
                    return ncmRepository.save(novoNcm);
                });
        novo.setNcm(ncm);

        Marca marca = marcaRepository.findByEmpresaIdOrderByNomeAsc(empresaContextService.getRequiredEmpresaId()).stream().findFirst()
                .orElseGet(() -> {
                    Marca novaMarca = new Marca();
                    novaMarca.setNome("GENÉRICA");
                    novaMarca.setEmpresaId(empresaContextService.getRequiredEmpresaId());
                    return marcaRepository.save(novaMarca);
                });
        novo.setMarca(marca);

        return produtoRepository.save(novo);
    }

    @Transactional
    public void excluirImportacao(Long id) {
        CompraXML nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada para exclusão."));

        if ("Finalizado".equals(nota.getStatus())) {
            for (CompraItem item : nota.getItens()) {
                if (item.getProdutoId() != null) {
                    produtoRepository.findById(item.getProdutoId()).ifPresent(produto -> {
                        int quantidadeParaSubtrair = item.getQuantidade().intValue();

                        estoqueService.registrarMovimentacao(
                                produto,
                                quantidadeParaSubtrair,
                                "SAIDA",
                                "ESTORNO: Exclusão da NF-e " + nota.getNumero(),
                                nota.getFornecedor(),
                                nota.getNumero()
                        );

                        int novoEstoque = produto.getQuantidadeEstoque() - quantidadeParaSubtrair;
                        produto.setQuantidadeEstoque(Math.max(0, novoEstoque));
                        produtoRepository.save(produto);

                        // 🚀 5. AUDITORIA: Estorno de estoque individual
                        auditoriaService.registrar("ESTOQUE", "ESTORNO_AUTOMATICO", "Estorno (Remoção) via exclusão de NF-e " + nota.getNumero() + ": " + produto.getNome() + " | Qtd removida: " + quantidadeParaSubtrair);
                    });
                }
            }
        }

        // 🚀 6. AUDITORIA: Exclusão definitiva da nota
        auditoriaService.registrar("COMPRAS", "EXCLUSAO_NFE", "Exclusão definitiva da Importação NF-e nº " + nota.getNumero() + " do Fornecedor " + nota.getFornecedor());

        compraXMLRepository.delete(nota);
    }
}
