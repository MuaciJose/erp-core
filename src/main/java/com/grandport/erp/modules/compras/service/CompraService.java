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
    @Autowired private EstoqueService estoqueService;

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
                        pDto.setId(i.getId());
                        pDto.setSku(i.getCodigoFornecedor());
                        pDto.setQuantidade(i.getQuantidade());
                        pDto.setEstoqueAtual(0); // Padrão

                        // 🚀 A MÁGICA AQUI: Se a peça for conhecida, puxa o nome limpo e o estoque do banco!
                        if (i.getProdutoId() != null) {
                            produtoRepository.findById(i.getProdutoId()).ifPresent(prod -> {
                                pDto.setNome(prod.getNome()); // Sobrescreve o nome sujo do XML!
                                pDto.setEstoqueAtual(prod.getQuantidadeEstoque()); // Envia o estoque atual pra tela
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

        Optional<CompraXML> notaExistente = compraXMLRepository.findByNumeroAndCnpjFornecedor(info.getIde().getNumeroNota(), info.getEmitente().getCnpj());
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

        // 🚀 FASE 1: APENAS RASCUNHA OS ITENS E FAZ O RECONHECIMENTO.
        for (NfeDTO.Detalhe detalhe : info.getDetalhes()) {
            ItemNotaDTO itemXml = detalhe.getProduto();

            // 🚀 INTELIGÊNCIA DE RECONHECIMENTO AUTOMÁTICO (EAN + SKU)
            Optional<Produto> prodOpt = Optional.empty();
            String codigoEan = itemXml.getEan();
            String codigoFornecedor = itemXml.getCodigoProduto();

            // Tentativa 1: Busca pelo Código de Barras (se for um código de verdade)
            if (codigoEan != null && !codigoEan.equalsIgnoreCase("SEM GTIN") && !codigoEan.trim().isEmpty()) {
                try {
                    prodOpt = produtoRepository.findByCodigoBarras(codigoEan);
                } catch (Exception e) {}
            }

            // Tentativa 2: Se não achou pelo EAN (ou era SEM GTIN), busca pelo SKU (Código do Fornecedor)
            if (prodOpt.isEmpty() && codigoFornecedor != null && !codigoFornecedor.trim().isEmpty()) {
                try {
                    prodOpt = produtoRepository.findBySku(codigoFornecedor);
                } catch (Exception e) {}
            }

            CompraItem item = new CompraItem();
            item.setProdutoId(prodOpt.map(Produto::getId).orElse(null)); // Se achou no estoque, preenche!
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

        return listarHistorico().stream().filter(n -> n.getId().equals(idSalvo)).findFirst().orElse(null);
    }

    @Transactional
    public void finalizarNota(Long id, ConfirmacaoNotaDTO dto) {
        CompraXML nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if("Finalizado".equals(nota.getStatus())) {
            throw new RuntimeException("Esta nota já está finalizada.");
        }

        // 🚀 FASE 2: AQUI SIM APLICAMOS A MATEMÁTICA E O ESTOQUE!
        if (dto != null && dto.getItens() != null) {
            for (ConfirmacaoNotaDTO.ItemConfirmacao itemDto : dto.getItens()) {

                // Busca o item original do XML
                CompraItem itemXml = nota.getItens().stream()
                        .filter(i -> i.getId().equals(itemDto.getIdImportacao()))
                        .findFirst().orElseThrow(() -> new RuntimeException("Item do XML não encontrado."));



                // Se o usuário vinculou ou já tinha ID, usa ele. Se for nulo, cria um novo agora!
                Produto produtoFinal;

                // Se o usuário vinculou ou já tinha ID do Rascunho, usa ele.
                if (itemDto.getProdutoId() != null) {
                    produtoFinal = produtoRepository.findById(itemDto.getProdutoId())
                            .orElseThrow(() -> new RuntimeException("Produto vinculado não encontrado no banco."));

                } else {
                    // 🛡️ PROTEÇÃO CONTRA A CONSTRAINT UNIQUE (Evita tentar criar produto duplicado)
                    // Tenta achar pelo EAN ou SKU uma última vez antes de mandar criar.
                    Optional<Produto> prodOpt = Optional.empty();
                    String codigoEan = itemXml.getEanBarras();
                    String skuFornecedor = itemXml.getCodigoFornecedor();

                    if (codigoEan != null && !codigoEan.equalsIgnoreCase("SEM GTIN") && !codigoEan.trim().isEmpty()) {
                        try { prodOpt = produtoRepository.findByCodigoBarras(codigoEan); } catch (Exception e) {}
                    }
                    if (prodOpt.isEmpty() && skuFornecedor != null && !skuFornecedor.trim().isEmpty()) {
                        try { prodOpt = produtoRepository.findBySku(skuFornecedor); } catch (Exception e) {}
                    }

                    // Se achou na repescagem, usa ele! Se não achou mesmo, aí sim cria o novo.
                    produtoFinal = prodOpt.orElseGet(() -> criarNovoProdutoPelaNota(itemXml, itemDto.getPrecoVenda()));
                }

                // Atualiza o custo e preço de venda com base na matemática da tela (Caixa -> Unidade)
                produtoFinal.setPrecoCusto(itemDto.getCustoFinal());
                produtoFinal.setPrecoVenda(itemDto.getPrecoVenda());
                produtoFinal = produtoRepository.save(produtoFinal);

                // Dá entrada no estoque usando a Quantidade Final (já multiplicada pelo fator de conversão)
                int quantidadeRealEntrada = itemDto.getQuantidadeFinal().intValue();
                estoqueService.registrarMovimentacao(
                        produtoFinal,
                        quantidadeRealEntrada,
                        "ENTRADA",
                        "Importação NF-e (Fator: " + itemDto.getFatorConversao() + ")",
                        nota.getFornecedor(),
                        nota.getNumero()
                );

                // Atualiza o rascunho com as decisões finais
                itemXml.setProdutoId(produtoFinal.getId());
                itemXml.setPrecoVenda(itemDto.getPrecoVenda());
            }
        }

        // 🚀 AGORA SIM GERA O CONTAS A PAGAR! (Evita criar boleto se o cara excluir a nota antes)
        Parceiro fornecedor = parceiroRepository.findByDocumento(nota.getCnpjFornecedor())
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

        nota.setStatus("Finalizado");
        compraXMLRepository.save(nota);
    }

    private Parceiro processarFornecedor(NfeDTO.Emitente emitente, ImportacaoResumoDTO resumo) {
        Optional<Parceiro> fornecedorExistente = parceiroRepository.findByDocumento(emitente.getCnpj());
        Parceiro fornecedor;
        boolean isNew = false;

        if (fornecedorExistente.isPresent()) {
            fornecedor = fornecedorExistente.get();
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
        novo.setQuantidadeEstoque(0); // Inicia com zero, o registrarMovimentacao fará a adição
        novo.setPrecoVenda(precoVenda != null ? precoVenda : item.getPrecoCusto().multiply(new BigDecimal("1.40")));

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

        return produtoRepository.save(novo);
    }

    @Transactional
    public void excluirImportacao(Long id) {
        // 1. Busca a nota antes de apagar para saber o que tinha nela
        CompraXML nota = compraXMLRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada para exclusão."));

        // 2. Se a nota já foi finalizada, precisamos ESTORNAR o estoque
        if ("Finalizado".equals(nota.getStatus())) {
            for (CompraItem item : nota.getItens()) {
                if (item.getProdutoId() != null) {
                    produtoRepository.findById(item.getProdutoId()).ifPresent(produto -> {

                        // 🚀 IMPORTANTE: Aqui usamos a quantidade que foi salva no item.
                        // Se você usou conversão (ex: 24 frascos), o item.getQuantidade()
                        // deve refletir o que foi somado.
                        // Se no seu banco o 'item' guarda a quantidade convertida, usamos ela:
                        int quantidadeParaSubtrair = item.getQuantidade().intValue();

                        // Registra a saída de estorno para o histórico ficar perfeito
                        estoqueService.registrarMovimentacao(
                                produto,
                                quantidadeParaSubtrair,
                                "SAIDA", // Ou crie um tipo "ESTORNO" no seu sistema
                                "ESTORNO: Exclusão da NF-e " + nota.getNumero(),
                                nota.getFornecedor(),
                                nota.getNumero()
                        );

                        // Atualiza o saldo do produto (O registrarMovimentacao já deve fazer isso,
                        // mas garantimos aqui se necessário)
                        int novoEstoque = produto.getQuantidadeEstoque() - quantidadeParaSubtrair;
                        produto.setQuantidadeEstoque(Math.max(0, novoEstoque)); // Evita estoque negativo se não permitido
                        produtoRepository.save(produto);
                    });
                }
            }
        }

        // 3. Agora sim, depois de limpar o estoque, apaga a nota do banco
        compraXMLRepository.delete(nota);
    }
}