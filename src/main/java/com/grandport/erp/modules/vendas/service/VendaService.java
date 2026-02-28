package com.grandport.erp.modules.vendas.service;

import com.grandport.erp.modules.estoque.model.Produto;
import com.grandport.erp.modules.estoque.repository.ProdutoRepository;
import com.grandport.erp.modules.financeiro.service.FinanceiroService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.dto.ItemVendaDTO;
import com.grandport.erp.modules.vendas.dto.PagamentoVendaDTO;
import com.grandport.erp.modules.vendas.dto.VendaRequestDTO;
import com.grandport.erp.modules.vendas.model.ItemVenda;
import com.grandport.erp.modules.vendas.model.PagamentoVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class VendaService {

    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private VendaRepository vendaRepository;
    @Autowired private FinanceiroService financeiroService;
    @Autowired private ParceiroRepository parceiroRepository;

    @Transactional
    public Venda processarVenda(VendaRequestDTO dto) {
        Venda venda = new Venda();
        BigDecimal subtotal = BigDecimal.ZERO;

        // 1. Processa itens e abate estoque
        for (ItemVendaDTO itemDTO : dto.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoId())
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: ID " + itemDTO.produtoId()));

            if (produto.getQuantidadeEstoque() < itemDTO.quantidade()) {
                throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
            }

            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDTO.quantidade());
            
            ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(), produto.getPrecoVenda());
            venda.getItens().add(item);
            
            subtotal = subtotal.add(produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemDTO.quantidade())));
        }
        
        // 2. Calcula totais
        venda.setValorSubtotal(subtotal);
        venda.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);
        venda.setValorTotal(subtotal.subtract(venda.getDesconto()));

        // 3. Processa pagamentos e integra com financeiro
        for (PagamentoVendaDTO pagDTO : dto.pagamentos()) {
            PagamentoVenda pagamento = new PagamentoVenda();
            pagamento.setMetodo(pagDTO.metodo());
            pagamento.setValor(pagDTO.valor());
            pagamento.setParcelas(pagDTO.parcelas());
            venda.getPagamentos().add(pagamento);

            if ("A PRAZO".equals(pagDTO.metodo())) {
                processarVendaAPrazo(venda, dto.parceiroId());
            } else if ("DINHEIRO".equals(pagDTO.metodo()) || "PIX".equals(pagDTO.metodo())) {
                financeiroService.registrarEntradaImediata(pagDTO.valor(), pagDTO.metodo());
            } else {
                financeiroService.gerarContaReceberCartao(pagDTO.valor(), pagDTO.parcelas());
            }
        }

        return vendaRepository.save(venda);
    }

    private void processarVendaAPrazo(Venda venda, Long parceiroId) {
        if (parceiroId == null) {
            throw new RuntimeException("Cliente não informado para venda a prazo.");
        }

        Parceiro cliente = parceiroRepository.findById(parceiroId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado: ID " + parceiroId));

        BigDecimal saldoDisponivel = cliente.getLimiteCredito().subtract(cliente.getSaldoDevedor());

        if (venda.getValorTotal().compareTo(saldoDisponivel) > 0) {
            throw new RuntimeException("Venda Bloqueada! Limite de crédito insuficiente. Disponível: R$ " + saldoDisponivel);
        }

        // Atualiza o saldo devedor do cliente
        cliente.setSaldoDevedor(cliente.getSaldoDevedor().add(venda.getValorTotal()));
        parceiroRepository.save(cliente);

        // Gera a conta a receber para o cliente
        financeiroService.gerarContaReceberPrazo(venda.getValorTotal(), cliente);
    }
}
