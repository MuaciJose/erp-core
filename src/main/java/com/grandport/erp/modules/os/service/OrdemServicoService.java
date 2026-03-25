package com.grandport.erp.modules.os.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.os.dto.OsRequestDTO;
import com.grandport.erp.modules.os.model.*;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.servicos.repository.ServicoRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.repository.ConfiguracaoRepository;
// 🚀 INJEÇÃO DO FINANCEIRO AQUI:
import com.grandport.erp.modules.financeiro.service.FinanceiroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class OrdemServicoService {

    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private VeiculoRepository veiculoRepository;
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private ServicoRepository servicoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private ConfiguracaoRepository configuracaoRepository;

    // 🚀 DECLARAÇÃO DO FINANCEIRO AQUI:
    @Autowired private FinanceiroService financeiroService;

    // =========================================================================
    // 🛡️ MOTOR DE SEGURANÇA E ESCOPO DE VISÃO (ROW-LEVEL SECURITY)
    // =========================================================================
    public List<OrdemServico> listarTodasAsOs() {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Sort ordem = Sort.by(Sort.Direction.DESC, "dataEntrada");

        if (usuarioLogado.getPermissoes() == null) return List.of();

        boolean isGestor = usuarioLogado.getPermissoes().contains("usuarios");
        boolean isCaixa = usuarioLogado.getPermissoes().contains("caixa");
        boolean isMecanico = Boolean.TRUE.equals(usuarioLogado.getIsMecanico());

        if (isGestor || isCaixa) {
            return osRepository.findAll(ordem);
        } else if (isMecanico) {
            return osRepository.findByMecanicoId(usuarioLogado.getId(), ordem);
        } else {
            return osRepository.findByConsultorId(usuarioLogado.getId(), ordem);
        }
    }

    // =========================================================================
    // MÉTODOS MANTIDOS (CRIAÇÃO, FATURAMENTO E AUDITORIA)
    // =========================================================================
    @Transactional
    public OrdemServico salvarRascunho(OsRequestDTO dto, Long osId) {
        boolean isNovaOs = (osId == null);

        OrdemServico os = (osId != null) ? osRepository.findById(osId).orElse(new OrdemServico()) : new OrdemServico();

        os.setCliente(dto.clienteId() != null ? parceiroRepository.findById(dto.clienteId()).orElse(null) : null);
        os.setVeiculo(dto.veiculoId() != null ? veiculoRepository.findById(dto.veiculoId()).orElse(null) : null);
        os.setKmEntrada(dto.kmEntrada());

        if (isNovaOs && dto.consultorId() == null) {
            Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            os.setConsultor(usuarioLogado);
        } else {
            os.setConsultor(dto.consultorId() != null ? usuarioRepository.findById(dto.consultorId()).orElse(null) : null);
        }

        os.setDefeitoRelatado(dto.defeitoRelatado());
        os.setDiagnosticoTecnico(dto.diagnosticoTecnico());
        os.setObservacoes(dto.observacoes());
        os.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);

        os.getItensPecas().clear();
        os.getItensServicos().clear();

        BigDecimal somaPecas = BigDecimal.ZERO;
        BigDecimal somaServicos = BigDecimal.ZERO;

        if (dto.pecas() != null) {
            for (var p : dto.pecas()) {
                OsItemPeca item = new OsItemPeca();
                item.setOrdemServico(os);
                item.setProduto(produtoRepository.findById(p.produtoId()).orElseThrow());
                item.setQuantidade(p.quantidade());
                item.setPrecoUnitario(p.precoUnitario());
                item.setValorTotal(p.precoUnitario().multiply(BigDecimal.valueOf(p.quantidade())));
                os.getItensPecas().add(item);
                somaPecas = somaPecas.add(item.getValorTotal());
            }
        }

        if (dto.servicos() != null) {
            for (var s : dto.servicos()) {
                OsItemServico item = new OsItemServico();
                item.setOrdemServico(os);
                item.setServico(servicoRepository.findById(s.servicoId()).orElseThrow());
                item.setMecanico(s.mecanicoId() != null ? usuarioRepository.findById(s.mecanicoId()).orElse(null) : null);
                item.setQuantidade(s.quantidade());
                item.setPrecoUnitario(s.precoUnitario());
                item.setValorTotal(s.precoUnitario().multiply(BigDecimal.valueOf(s.quantidade())));
                os.getItensServicos().add(item);
                somaServicos = somaServicos.add(item.getValorTotal());
            }
        }

        os.setTotalPecas(somaPecas);
        os.setTotalServicos(somaServicos);
        os.setValorTotal(somaPecas.add(somaServicos).subtract(os.getDesconto()));

        OrdemServico salva = osRepository.save(os);

        String acao = isNovaOs ? "CRIACAO_OS" : "EDICAO_OS";
        String verbo = isNovaOs ? "Criou" : "Editou e salvou";
        String clienteNome = salva.getCliente() != null ? salva.getCliente().getNome() : "Sem cliente";

        auditoriaService.registrar("ORDEM_SERVICO", acao, verbo + " o rascunho da OS #" + salva.getId() + " para o cliente '" + clienteNome + "'. Valor Atual: R$ " + salva.getValorTotal());

        return salva;
    }

    @Transactional
    public OrdemServico faturarOS(Long osId) {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        if (os.getStatus() == com.grandport.erp.modules.os.model.StatusOS.FATURADA) {
            throw new RuntimeException("Esta OS já foi faturada e fechada!");
        }

        var config = configuracaoRepository.findById(1L).orElse(null);
        boolean globalLiberado = config != null && Boolean.TRUE.equals(config.getPermitirEstoqueNegativoGlobal());

        for (OsItemPeca item : os.getItensPecas()) {
            Produto p = item.getProduto();
            boolean produtoLiberado = Boolean.TRUE.equals(p.getPermitirEstoqueNegativo());

            if (p.getQuantidadeEstoque() < item.getQuantidade()) {
                if (!globalLiberado && !produtoLiberado) {
                    throw new RuntimeException("Estoque insuficiente para a peça: " + p.getNome());
                }
            }

            p.setQuantidadeEstoque(p.getQuantidadeEstoque() - item.getQuantidade());
            produtoRepository.save(p);
            auditoriaService.registrar("ESTOQUE", "SAIDA_OS", "Baixa de " + item.getQuantidade() + "un de '" + p.getNome() + "' ref. OS #" + os.getId());
        }

        os.setStatus(com.grandport.erp.modules.os.model.StatusOS.FATURADA);
        OrdemServico salva = osRepository.save(os);

        auditoriaService.registrar("ORDEM_SERVICO", "FATURAMENTO_OS", "Faturou e fechou a OS #" + salva.getId() + ". Peças baixadas do estoque e valor consolidado de R$ " + salva.getValorTotal());

        return salva;
    }

    @Transactional
    public OrdemServico faturarOSPagamento(Long osId, java.util.List<java.util.Map<String, Object>> pagamentosRequest) {
        OrdemServico os = osRepository.findById(osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));

        if (os.getStatus() == com.grandport.erp.modules.os.model.StatusOS.FATURADA) {
            throw new RuntimeException("Esta OS já foi faturada e fechada!");
        }

        // 🚀 O EXTRATOR INTELIGENTE
        for (java.util.Map<String, Object> mapa : pagamentosRequest) {
            String metodoStr = mapa.get("metodo") != null ? String.valueOf(mapa.get("metodo")).toUpperCase() : "DINHEIRO";
            java.math.BigDecimal valor = mapa.get("valor") != null ? new java.math.BigDecimal(String.valueOf(mapa.get("valor"))) : java.math.BigDecimal.ZERO;
            Integer parcelas = mapa.get("parcelas") != null ? Integer.parseInt(String.valueOf(mapa.get("parcelas"))) : 1;

            // 🚀 ADICIONAMOS O "FIADO" AQUI TAMBÉM:
            if ("A_PRAZO".equals(metodoStr) || "PROMISSORIA".equals(metodoStr) || "FIADO".equals(metodoStr)) {
                financeiroService.gerarContaReceberPrazoOS(os, os.getCliente(), parcelas, valor);

            } else if (metodoStr.contains("CARTAO") || metodoStr.contains("CREDITO")) {
                financeiroService.gerarContaReceberCartao(valor, parcelas, os.getCliente(), "OS #" + os.getId());

            } else {
                financeiroService.registrarEntradaImediata(valor, "OS #" + os.getId() + " - " + metodoStr);
            }
        }


        // Depois de gravar o dinheiro com segurança, fecha a OS!
        return this.faturarOS(osId);
    }
}