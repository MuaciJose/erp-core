package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import com.grandport.erp.modules.configuracoes.model.VendedorComissao;
import com.grandport.erp.modules.configuracoes.service.ConfiguracaoService;
import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
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

    // =========================================================================
    // MÉTODO AUXILIAR: CALCULA E GRAVA A COMISSÃO (CONGELA O VALOR)
    // =========================================================================
    private void aplicarComissaoVendedor(Venda venda) {
        if (venda.getVendedorId() == null) return;

        ConfiguracaoSistema configs = configService.obterConfiguracao();

        // Busca a porcentagem definida para este vendedor nas configurações
        BigDecimal percentual = configs.getVendedores().stream()
                .filter(v -> v.getUsuarioId().equals(venda.getVendedorId()))
                .map(VendedorComissao::getComissao)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        if (percentual.compareTo(BigDecimal.ZERO) > 0) {
            // Cálculo: (ValorTotal * Percentual) / 100
            BigDecimal valorCalculado = venda.getValorTotal()
                    .multiply(percentual)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            venda.setValorComissao(valorCalculado);
        } else {
            venda.setValorComissao(BigDecimal.ZERO);
        }
    }

    // =========================================================================
    // CORREÇÃO: BLINDAGEM CONTRA NULLPOINTER EXCEPTION NO ESTOQUE
    // =========================================================================
    private void validarEstoque(VendaRequestDTO dto) {
        if (dto.itens() == null || dto.itens().isEmpty()) {
            throw new RuntimeException("O carrinho de compras está vazio. Adicione itens para finalizar a venda.");
        }

        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado no estoque"));

            if (Boolean.TRUE.equals(produto.getPermitirEstoqueNegativo())) {
                continue;
            }

            int estoqueDisponivel = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;

            if (estoqueDisponivel < itemDTO.quantidade()) {
                throw new RuntimeException("Estoque insuficiente da peça: " + produto.getNome()
                        + " (Faltam " + (itemDTO.quantidade() - estoqueDisponivel)
                        + " unidades. Disponível: " + estoqueDisponivel + ")");
            }
        }
    }

    @Transactional
    public Venda salvarOrcamento(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.ORCAMENTO);
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda criarPedido(VendaRequestDTO dto) {
        validarEstoque(dto);
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.AGUARDANDO_PAGAMENTO);
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda atualizarVenda(Long id, VendaRequestDTO dto) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        if (venda.getStatus() == StatusVenda.CONCLUIDA) {
            throw new RuntimeException("Operação Negada: Vendas faturadas não podem ser alteradas.");
        }

        if (venda.getStatus() == StatusVenda.AGUARDANDO_PAGAMENTO && (dto.status() == StatusVenda.ORCAMENTO || dto.status() == StatusVenda.PEDIDO)) {
            throw new RuntimeException("Operação Negada: O documento já está no Caixa.");
        }

        if (venda.getStatus() == StatusVenda.PEDIDO && dto.status() == StatusVenda.ORCAMENTO) {
            throw new RuntimeException("Operação Negada: Um Pedido Oficial não pode ser revertido para Orçamento.");
        }

        if (dto.status() == StatusVenda.PEDIDO || dto.status() == StatusVenda.AGUARDANDO_PAGAMENTO) {
            validarEstoque(dto);
        }

        if (dto.status() != null) {
            venda.setStatus(dto.status());
        }

        venda.getItens().clear();
        Venda salva = preencherESalvarVenda(venda, dto);

        if (venda.getStatus() == StatusVenda.AGUARDANDO_PAGAMENTO && dto.status() == StatusVenda.AGUARDANDO_PAGAMENTO) {
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

        vendaRepository.delete(venda);
        try { auditoriaService.registrar("VENDAS", "EXCLUSAO", "Documento #" + id + " excluído com sucesso."); } catch(Exception e){}
    }

    // =========================================================================
    // CORREÇÃO: BLINDAGEM CONTRA NULLPOINTER EXCEPTION NO SALVAMENTO
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

        if (dto.parceiroId() != null) {
            venda.setCliente(parceiroRepository.findById(dto.parceiroId()).orElse(null));
        } else {
            venda.setCliente(null);
        }

        if (dto.veiculoId() != null) {
            venda.setVeiculo(veiculoRepository.findById(dto.veiculoId()).orElse(null));
        } else {
            venda.setVeiculo(null);
        }

        if (dto.kmVeiculo() != null && venda.getVeiculo() != null) {
            venda.setKmVeiculo(dto.kmVeiculo());
            Veiculo v = venda.getVeiculo();
            v.setKm(dto.kmVeiculo());
            veiculoRepository.save(v);
        }

        BigDecimal subtotal = BigDecimal.ZERO;

        // Proteção aqui: Só tenta ler a lista se ela não for nula!
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

        for (ItemVenda item : venda.getItens()) {
            Produto produto = item.getProduto();
            if (Boolean.TRUE.equals(produto.getPermitirEstoqueNegativo())) continue;

            int estoqueDisponivel = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;
            if (estoqueDisponivel < item.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente de " + produto.getNome());
            }
        }

        for (PagamentoVendaDTO pagDTO : pagamentos) {
            PagamentoVenda pagamento = new PagamentoVenda();
            pagamento.setMetodo(pagDTO.metodo());
            pagamento.setValor(pagDTO.valor());
            pagamento.setParcelas(pagDTO.parcelas());
            venda.getPagamentos().add(pagamento);

            if ("A_PRAZO".equals(pagDTO.metodo())) {
                processarVendaAPrazo(venda, venda.getCliente() != null ? venda.getCliente().getId() : null);
            } else {
                caixaService.adicionarVendaAoCaixa(pagDTO.metodo(), pagDTO.valor());
                financeiroService.registrarEntradaImediata(pagDTO.valor(), pagDTO.metodo());
            }
        }

        for (ItemVenda item : venda.getItens()) {
            Produto produto = item.getProduto();
            int estoqueAtual = produto.getQuantidadeEstoque() != null ? produto.getQuantidadeEstoque() : 0;
            produto.setQuantidadeEstoque(estoqueAtual - item.getQuantidade());
            produtoRepository.save(produto);
        }

        aplicarComissaoVendedor(venda);

        venda.setStatus(StatusVenda.CONCLUIDA);
        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda processarVenda(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.CONCLUIDA);

        Venda salva = preencherESalvarVenda(venda, dto);
        aplicarComissaoVendedor(salva);

        return vendaRepository.save(salva);
    }

    private void processarVendaAPrazo(Venda venda, Long parceiroId) {
        if (parceiroId == null) throw new RuntimeException("Cliente não informado para venda a prazo.");

        Parceiro cliente = parceiroRepository.findById(parceiroId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));

        BigDecimal saldoDisponivel = cliente.getLimiteCredito().subtract(cliente.getSaldoDevedor());

        if (venda.getValorTotal().compareTo(saldoDisponivel) > 0) {
            throw new RuntimeException("Venda Bloqueada! Limite de crédito insuficiente.");
        }

        cliente.setSaldoDevedor(cliente.getSaldoDevedor().add(venda.getValorTotal()));
        parceiroRepository.save(cliente);

        financeiroService.gerarContaReceberPrazo(venda.getValorTotal(), cliente);
    }

    @Transactional
    public Venda devolverAoVendedor(Long vendaId) {
        Venda venda = vendaRepository.findById(vendaId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (venda.getStatus() != StatusVenda.AGUARDANDO_PAGAMENTO) {
            throw new RuntimeException("Apenas pedidos na fila do caixa podem ser devolvidos.");
        }

        venda.setStatus(StatusVenda.PEDIDO);

        try {
            auditoriaService.registrar("VENDAS", "DEVOLUCAO", "Pedido #" + vendaId + " devolvido pelo Caixa.");
        } catch (Exception e) {}

        return vendaRepository.save(venda);
    }
}