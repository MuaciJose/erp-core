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

    // =========================================================================
    // 🛡️ MOTOR DE SEGURANÇA E ESCOPO DE VISÃO (ROW-LEVEL SECURITY)
    // =========================================================================
    public List<OrdemServico> listarTodasAsOs() {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Sort ordem = Sort.by(Sort.Direction.DESC, "dataEntrada"); // Ordena das mais recentes para as mais velhas

        if (usuarioLogado.getPermissoes() == null) return List.of();

        boolean isGestor = usuarioLogado.getPermissoes().contains("usuarios");
        boolean isCaixa = usuarioLogado.getPermissoes().contains("caixa");
        boolean isMecanico = Boolean.TRUE.equals(usuarioLogado.getIsMecanico());

        if (isGestor || isCaixa) {
            // Chefe ou Caixa vê todas as OSs da oficina inteira!
            return osRepository.findAll(ordem);
        } else if (isMecanico) {
            // Mecânico só vê as OSs onde ele tem serviço pra executar
            return osRepository.findByMecanicoId(usuarioLogado.getId(), ordem);
        } else {
            // Consultor/Vendedor só vê as OSs que ele abriu
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

        // 🚀 SE FOR NOVA OS, FORÇA O CONSULTOR COMO O USUÁRIO LOGADO, A NÃO SER QUE SEJA UM GESTOR PASSANDO PRA OUTRO
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

        return this.faturarOS(osId);
    }
}