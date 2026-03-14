package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.model.VendedorComissao;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.estoque.service.EstoqueService;
import com.grandport.erp.modules.financeiro.service.CaixaService;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import com.grandport.erp.modules.vendas.dto.ItemVendaDTO;
import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.*;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class VendaService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private VendaRepository vendaRepository;
    @Autowired private FinanceiroService financeiroService;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private VeiculoRepository veiculoRepository;
    @Autowired private CaixaService caixaService;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private ConfiguracaoService configService;
    @Autowired private EstoqueService estoqueService;

    // =========================================================================
    // MÉTODO AUXILIAR: COMISSÃO (MANTIDO 100%)
    // =========================================================================
    private void aplicarComissaoVendedor(Venda venda) {
        if (venda.getVendedorId() == null) return;

        ConfiguracaoSistema configs = configService.obterConfiguracao();
        BigDecimal percentual = configs.getVendedores().stream()
                .filter(v -> v.getUsuarioId().equals(venda.getVendedorId()))
                .map(VendedorComissao::getComissao)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        if (percentual.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal valorCalculado = venda.getValorTotal()
                    .multiply(percentual)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            venda.setValorComissao(valorCalculado);
        } else {
            venda.setValorComissao(BigDecimal.ZERO);
        }
    }

    // =========================================================================
    // 🔄 MÉTODOS DE ESTOQUE (AGORA COM REGISTRO NO EXTRATO)
    // =========================================================================
    private void baixarEstoque(Venda venda) {
        String clienteNome = venda.getCliente() != null ? venda.getCliente().getNome() : "CONSUMIDOR FINAL";
        String documento = venda.getId() != null ? "VENDA #" + venda.getId() : "PDV";

        for (ItemVenda item : venda.getItens()) {
            // O estoqueService já faz o p.setQuantidadeEstoque e o produtoRepository.save(p)
            estoqueService.registrarMovimentacao(
                    item.getProduto(),
                    item.getQuantidade(),
                    "SAIDA",
                    "Venda de Mercadoria",
                    clienteNome,
                    documento
            );
        }
    }

    private void devolverEstoque(Venda venda) {
        String clienteNome = venda.getCliente() != null ? venda.getCliente().getNome() : "CONSUMIDOR FINAL";
        String documento = venda.getId() != null ? "ESTORNO #" + venda.getId() : "CANCEL";

        for (ItemVenda item : venda.getItens()) {
            estoqueService.registrarMovimentacao(
                    item.getProduto(),
                    item.getQuantidade(),
                    "ENTRADA",
                    "Devolução/Cancelamento de Pedido",
                    clienteNome,
                    documento
            );
        }
    }

    private void validarEstoqueFisico(VendaRequestDTO dto) {
        if (dto.itens() == null || dto.itens().isEmpty()) {
            throw new RuntimeException("O carrinho de compras está vazio.");
        }

        ConfiguracaoSistema config = configService.obterConfiguracao();
        boolean permitirGlobal = config.getPermitirEstoqueNegativoGlobal() != null && config.getPermitirEstoqueNegativoGlobal();

        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado no estoque"));

            if (permitirGlobal || Boolean.TRUE.equals(produto.getPermitirEstoqueNegativo())) {
                continue;
            }

            int estoqueFisico = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;

            if (estoqueFisico < itemDTO.quantidade()) {
                throw new RuntimeException("Estoque insuficiente da peça: " + produto.getNome()
                        + " (Faltam " + (itemDTO.quantidade() - estoqueFisico)
                        + " unidades. Disponível: " + estoqueFisico + ")");
            }
        }
    }

    // =========================================================================
    // CRIAÇÃO E EDIÇÃO DE DOCUMENTOS (TODOS OS LOGS DE VOLTA!)
    // =========================================================================
    @Transactional
    public Venda salvarOrcamento(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.ORCAMENTO);
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda criarPedido(VendaRequestDTO dto) {
        validarEstoqueFisico(dto);
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.AGUARDANDO_PAGAMENTO);
        Venda salva = preencherESalvarVenda(venda, dto);
        baixarEstoque(salva);
        return salva;
    }

    @Transactional
    public Venda atualizarVenda(Long id, VendaRequestDTO dto) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        if (venda.getStatus() == StatusVenda.CONCLUIDA) {
            throw new RuntimeException("Operação Negada: Vendas faturadas não podem ser alteradas.");
        }

        StatusVenda statusAntigo = venda.getStatus();
        StatusVenda statusNovo = dto.status() != null ? dto.status() : statusAntigo;

        // Devolve estoque antes de recalcular
        if (statusAntigo == StatusVenda.PEDIDO || statusAntigo == StatusVenda.AGUARDANDO_PAGAMENTO) {
            devolverEstoque(venda);
        }

        if (statusNovo == StatusVenda.PEDIDO || statusNovo == StatusVenda.AGUARDANDO_PAGAMENTO) {
            validarEstoqueFisico(dto);
        }

        venda.setStatus(statusNovo);
        venda.getItens().clear();

        if (statusAntigo != StatusVenda.AGUARDANDO_PAGAMENTO && statusNovo == StatusVenda.AGUARDANDO_PAGAMENTO) {
            venda.setDataHora(java.time.LocalDateTime.now());
        }

        Venda salva = preencherESalvarVenda(venda, dto);

        if (statusNovo == StatusVenda.PEDIDO || statusNovo == StatusVenda.AGUARDANDO_PAGAMENTO) {
            baixarEstoque(salva);
        }

        // 🚀 LOG DE AUDITORIA RESTAURADO
        if (statusNovo == StatusVenda.AGUARDANDO_PAGAMENTO) {
            try { auditoriaService.registrar("VENDAS", "CONVERSAO", "Documento #" + salva.getId() + " enviado para o Caixa."); } catch(Exception e){}
        }

        return salva;
    }

    @Transactional
    public void excluirVenda(Long id) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        if (venda.getStatus() == StatusVenda.CONCLUIDA) {
            throw new RuntimeException("Operação Negada: Vendas faturadas não podem ser excluídas.");
        }

        if (venda.getStatus() == StatusVenda.PEDIDO || venda.getStatus() == StatusVenda.AGUARDANDO_PAGAMENTO) {
            devolverEstoque(venda);
        }

        vendaRepository.delete(venda);
        // 🚀 LOG DE AUDITORIA RESTAURADO
        try { auditoriaService.registrar("VENDAS", "EXCLUSAO", "Documento #" + id + " excluído com sucesso."); } catch(Exception e){}
    }

    // =========================================================================
    // PREENCHE E SALVA (MANTIDO 100%)
    // =========================================================================
    private Venda preencherESalvarVenda(Venda venda, VendaRequestDTO dto) {
        try {
            Usuario vendedor = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            venda.setVendedorNome(vendedor.getNomeCompleto());
            venda.setVendedorId(vendedor.getId());
        } catch (Exception e) {
            venda.setVendedorNome("Balcão");
            venda.setVendedorId(null);
        }

        venda.setCliente(dto.parceiroId() != null ? parceiroRepository.findById(dto.parceiroId()).orElse(null) : null);
        venda.setVeiculo(dto.veiculoId() != null ? veiculoRepository.findById(dto.veiculoId()).orElse(null) : null);

        if (dto.kmVeiculo() != null && venda.getVeiculo() != null) {
            venda.setKmVeiculo(dto.kmVeiculo());
            Veiculo v = venda.getVeiculo();
            v.setKm(dto.kmVeiculo());
            veiculoRepository.save(v);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        if (dto.itens() != null) {
            for (ItemVendaDTO itemDTO : dto.itens()) {
                Produto produto = produtoRepository.findById(itemDTO.produtoId())
                        .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

                ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(),
                        itemDTO.precoUnitario() != null ? itemDTO.precoUnitario() : produto.getPrecoVenda());

                venda.getItens().add(item);
                subtotal = subtotal.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
            }
        }

        venda.setValorSubtotal(subtotal);
        venda.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);
        venda.setValorTotal(subtotal.subtract(venda.getDesconto()));

        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda finalizarPagamentoPedido(Long vendaId, List<PagamentoVendaDTO> pagamentos) {
        Venda venda = vendaRepository.findById(vendaId).orElseThrow();

        if(venda.getStatus() == StatusVenda.CONCLUIDA) {
            throw new RuntimeException("Este pedido já foi faturado!");
        }

        for (PagamentoVendaDTO pagDTO : pagamentos) {
            PagamentoVenda pagamento = new PagamentoVenda();
            pagamento.setMetodo(pagDTO.metodo());
            pagamento.setValor(pagDTO.valor());
            pagamento.setParcelas(pagDTO.parcelas());
            venda.getPagamentos().add(pagamento);

            if ("A_PRAZO".equals(pagDTO.metodo()) || "PROMISSORIA".equals(pagDTO.metodo())) {
                processarVendaAPrazo(venda, venda.getCliente() != null ? venda.getCliente().getId() : null, pagDTO.parcelas());
            } else {
                caixaService.adicionarVendaAoCaixa(pagDTO.metodo(), pagDTO.valor());
                financeiroService.registrarEntradaImediata(pagDTO.valor(), pagDTO.metodo());
            }
        }

        aplicarComissaoVendedor(venda);
        venda.setStatus(StatusVenda.CONCLUIDA);
        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda processarVenda(VendaRequestDTO dto) {
        validarEstoqueFisico(dto);
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.CONCLUIDA);
        Venda salva = preencherESalvarVenda(venda, dto);
        baixarEstoque(salva);
        aplicarComissaoVendedor(salva);
        return vendaRepository.save(salva);
    }

    private void processarVendaAPrazo(Venda venda, Long parceiroId, Integer parcelas) {
        if (parceiroId == null) throw new RuntimeException("Cliente não informado para venda a prazo.");
        Parceiro cliente = parceiroRepository.findById(parceiroId).orElseThrow();
        BigDecimal saldoDisponivel = cliente.getLimiteCredito().subtract(cliente.getSaldoDevedor());
        if (venda.getValorTotal().compareTo(saldoDisponivel) > 0) {
            throw new RuntimeException("Venda Bloqueada! Limite de crédito insuficiente.");
        }
        cliente.setSaldoDevedor(cliente.getSaldoDevedor().add(venda.getValorTotal()));
        parceiroRepository.save(cliente);
        financeiroService.gerarContaReceberPrazo(venda, cliente, parcelas);
    }

    @Transactional
    public Venda devolverAoVendedor(Long vendaId) {
        Venda venda = vendaRepository.findById(vendaId).orElseThrow();
        if (venda.getStatus() != StatusVenda.AGUARDANDO_PAGAMENTO) {
            throw new RuntimeException("Apenas pedidos na fila do caixa podem ser devolvidos.");
        }
        venda.setStatus(StatusVenda.PEDIDO);
        // 🚀 LOG DE AUDITORIA RESTAURADO
        try { auditoriaService.registrar("VENDAS", "DEVOLUCAO", "Pedido #" + vendaId + " devolvido pelo Caixa."); } catch (Exception e) {}
        return vendaRepository.save(venda);
    }
}