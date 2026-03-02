package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
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

    @Transactional
    public Venda salvarOrcamento(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.ORCAMENTO);
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda atualizarOrcamento(Long id, VendaRequestDTO dto) {
        Venda venda = vendaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Orçamento não encontrado"));
        
        if (venda.getStatus() != StatusVenda.ORCAMENTO) {
            throw new RuntimeException("Apenas orçamentos podem ser editados.");
        }

        venda.getItens().clear();
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda converterParaPedido(Long id, VendaRequestDTO dto) {
        Venda venda;
        if (id != null) {
            venda = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento não encontrado"));
        } else {
            venda = new Venda();
        }

        venda.setStatus(StatusVenda.AGUARDANDO_PAGAMENTO);
        Venda salva = preencherESalvarVenda(venda, dto);
        
        auditoriaService.registrar("VENDAS", "CONVERSAO", "Orçamento #" + salva.getId() + " convertido em Pedido.");
        return salva;
    }

    private Venda preencherESalvarVenda(Venda venda, VendaRequestDTO dto) {
        try {
            Usuario vendedor = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            venda.setVendedorNome(vendedor.getNomeCompleto());
        } catch (Exception e) {
            venda.setVendedorNome("Balcão");
        }

        if (dto.parceiroId() != null) {
            venda.setCliente(parceiroRepository.findById(dto.parceiroId()).orElse(null));
        }
        if (dto.veiculoId() != null) {
            venda.setVeiculo(veiculoRepository.findById(dto.veiculoId()).orElse(null));
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoId())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
            
            ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(), 
                itemDTO.precoUnitario() != null ? itemDTO.precoUnitario() : produto.getPrecoVenda());
            
            venda.getItens().add(item);
            subtotal = subtotal.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
        }

        venda.setValorSubtotal(subtotal);
        venda.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);
        venda.setValorTotal(subtotal.subtract(venda.getDesconto()));

        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda finalizarPagamentoPedido(Long vendaId, List<PagamentoVendaDTO> pagamentos) {
        Venda venda = vendaRepository.findById(vendaId).orElseThrow();
        
        // 1. Verifica estoque de todos os itens ANTES de processar qualquer pagamento
        for (ItemVenda item : venda.getItens()) {
            Produto produto = item.getProduto();
            if (produto.getQuantidadeEstoque() < item.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para: " + produto.getNome() + " (Disponível: " + produto.getQuantidadeEstoque() + ")");
            }
        }

        // 2. Processa pagamentos
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

        // 3. Abate estoque
        for (ItemVenda item : venda.getItens()) {
            Produto produto = item.getProduto();
            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - item.getQuantidade());
            produtoRepository.save(produto);
        }

        venda.setStatus(StatusVenda.CONCLUIDA);
        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda processarVenda(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.CONCLUIDA);
        return preencherESalvarVenda(venda, dto);
    }

    private void processarVendaAPrazo(Venda venda, Long parceiroId) {
        if (parceiroId == null) throw new RuntimeException("Cliente não informado para venda a prazo.");

        Parceiro cliente = parceiroRepository.findById(parceiroId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado: ID " + parceiroId));

        BigDecimal saldoDisponivel = cliente.getLimiteCredito().subtract(cliente.getSaldoDevedor());

        if (venda.getValorTotal().compareTo(saldoDisponivel) > 0) {
            throw new RuntimeException("Venda Bloqueada! Limite de crédito insuficiente.");
        }

        cliente.setSaldoDevedor(cliente.getSaldoDevedor().add(venda.getValorTotal()));
        parceiroRepository.save(cliente);

        financeiroService.gerarContaReceberPrazo(venda.getValorTotal(), cliente);
    }
}
