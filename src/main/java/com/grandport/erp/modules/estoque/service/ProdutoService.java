package com.grandport.erp.modules.estoque.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
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
    @Autowired private EmpresaContextService empresaContextService;

    // Motor de Auditoria já estava injetado perfeitamente!
    @Autowired private AuditoriaService auditoriaService;

    @Transactional
    public Produto cadastrar(ProdutoRequestDTO dto, String imagePath) {
        Marca marca = null;
        if (dto.marcaId() != null) {
            marca = marcaRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), dto.marcaId()).orElse(null);
        }

        Ncm ncm = null;
        if (dto.ncmCodigo() != null && !dto.ncmCodigo().trim().isEmpty()) {
            ncm = ncmRepository.findByCodigoAndEmpresaId(dto.ncmCodigo(), empresaContextService.getRequiredEmpresaId()).orElse(null);
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
            marca = marcaRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), dto.marcaId()).orElse(null);
        }

        Ncm ncm = null;
        if (dto.ncmCodigo() != null && !dto.ncmCodigo().trim().isEmpty()) {
            ncm = ncmRepository.findByCodigoAndEmpresaId(dto.ncmCodigo(), empresaContextService.getRequiredEmpresaId()).orElse(null);
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
        return produtoRepository.findAlertasEstoqueByEmpresa(empresaContextService.getRequiredEmpresaId());
    }

    public List<Produto> buscarProdutos(String termo) {
        return produtoRepository.buscarPorTermo(termo, empresaContextService.getRequiredEmpresaId());
    }

    public Produto findById(Long id) {
        return produtoRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id)
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

    /**
     * 🔍 AUDITORIA FISCAL: Verifica integridade de dados fiscais de todos os produtos
     * Identifica quais produtos estão prontos para emitir NF-e
     * 
     * @return Mapa contendo status de sincronização fiscal
     */
    public java.util.Map<String, Object> validarIntegridadeFiscal() {
        java.util.List<Produto> todosProdutos = produtoRepository.findAllByEmpresa(empresaContextService.getRequiredEmpresaId());
        java.util.List<Produto> produtosIncompletos = new java.util.ArrayList<>();

        // Verificar cada produto
        for (Produto p : todosProdutos) {
            java.util.List<String> problemas = new java.util.ArrayList<>();

            // Validação 1: NCM
            if (p.getNcm() == null || p.getNcm().getCodigo() == null || p.getNcm().getCodigo().trim().isEmpty()) {
                problemas.add("NCM");
            }

            // Validação 2: CFOP
            if (p.getCfopPadrao() == null || p.getCfopPadrao().trim().isEmpty()) {
                problemas.add("CFOP");
            }

            // Validação 3: CSOSN ou CST
            if ((p.getCsosnPadrao() == null || p.getCsosnPadrao().trim().isEmpty()) &&
                (p.getCstPadrao() == null || p.getCstPadrao().trim().isEmpty())) {
                problemas.add("CSOSN/CST");
            }

            // Validação 4: Alíquota ICMS
            if (p.getAliquotaIcms() == null) {
                problemas.add("Alíquota ICMS");
            }

            // Validação 5: Marca
            if (p.getMarca() == null) {
                problemas.add("Marca");
            }

            // Se encontrou problemas, adiciona à lista de incompletos
            if (!problemas.isEmpty()) {
                produtosIncompletos.add(p);
            }
        }

        // Montar resultado
        java.util.Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("total_produtos", todosProdutos.size());
        resultado.put("produtos_ok_para_fiscal", todosProdutos.size() - produtosIncompletos.size());
        resultado.put("produtos_incompletos", produtosIncompletos.size());

        // Calcular percentual
        int percentual = todosProdutos.isEmpty() ? 100 : 
            ((todosProdutos.size() - produtosIncompletos.size()) * 100 / todosProdutos.size());
        resultado.put("percentual_completo", percentual);

        // Detalhar produtos incompletos
        resultado.put("lista_incompletos", 
            produtosIncompletos.stream()
                .map(p -> {
                    java.util.Map<String, Object> item = new java.util.HashMap<>();
                    item.put("id", p.getId());
                    item.put("nome", p.getNome());
                    item.put("sku", p.getSku() != null ? p.getSku() : "SEM SKU");
                    item.put("ncm", p.getNcm() != null ? p.getNcm().getCodigo() : "❌ FALTANDO");
                    item.put("cfop", p.getCfopPadrao() != null ? p.getCfopPadrao() : "❌ FALTANDO");
                    item.put("csosn", p.getCsosnPadrao() != null ? p.getCsosnPadrao() : "❌ FALTANDO");
                    item.put("cst", p.getCstPadrao() != null ? p.getCstPadrao() : "❌ FALTANDO");
                    item.put("marca", p.getMarca() != null ? p.getMarca().getNome() : "❌ FALTANDO");
                    item.put("aliquota_icms", p.getAliquotaIcms() != null ? p.getAliquotaIcms() : "❌ FALTANDO");
                    return item;
                })
                .collect(java.util.stream.Collectors.toList())
        );

        // 🚀 AUDITORIA: Registrar auditoria desta verificação
        auditoriaService.registrar("ESTOQUE", "AUDITORIA_FISCAL", 
            String.format("Auditoria Fiscal: %d de %d produtos prontos (%.1f%%)",
                todosProdutos.size() - produtosIncompletos.size(),
                todosProdutos.size(),
                percentual));

        return resultado;
    }
}
