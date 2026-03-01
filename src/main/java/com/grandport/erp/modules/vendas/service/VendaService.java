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

        // Limpa os itens antigos para adicionar os novos
        venda.getItens().clear();
        
        return preencherESalvarVenda(venda, dto);
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
            Produto produto = produtoRepository.findById(itemDTO.produtoId()).get();
            ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(), itemDTO.precoUnitario() != null ? itemDTO.precoUnitario() : produto.getPrecoVenda());
            venda.getItens().add(item);
            subtotal = subtotal.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
        }

        venda.setValorSubtotal(subtotal);
        venda.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);
        venda.setValorTotal(subtotal.subtract(venda.getDesconto()));

        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda criarPedido(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.AGUARDANDO_PAGAMENTO);
        return preencherESalvarVenda(venda, dto);
    }

    @Transactional
    public Venda finalizarPagamentoPedido(Long vendaId, List<PagamentoVendaDTO> pagamentos) {
        Venda venda = vendaRepository.findById(vendaId).orElseThrow();
        
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
            if (produto.getQuantidadeEstoque() < item.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
            }
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
        
        // ... (lógica de venda direta mantida, mas idealmente refatorada para usar preencherESalvarVenda se possível, mas tem a questão do estoque imediato)
        // Para simplificar e não quebrar o que já funciona, vou manter o código original do processarVenda aqui, mas você pode refatorar depois.
        
        try {
            Usuario vendedor = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            venda.setVendedorNome(vendedor.getNomeCompleto());
        } catch (Exception e) {
            venda.setVendedorNome("Caixa Direto");
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
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: ID " + itemDTO.produtoId()));

            if (produto.getQuantidadeEstoque() < itemDTO.quantidade()) {
                throw new RuntimeException("Estoque insuficiente para: " + produto.getNome());
            }

            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDTO.quantidade());
            
            ItemVenda item = new ItemVenda(venda, produto, itemDTO.quantidade(), produto.getPrecoVenda());
            venda.getItens().add(item);
            
            subtotal = subtotal.add(produto.getPrecoVenda().multiply(BigDecimal.valueOf(itemDTO.quantidade())));
        }
        
        venda.setValorSubtotal(subtotal);
        venda.setDesconto(dto.desconto() != null ? dto.desconto() : BigDecimal.ZERO);
        venda.setValorTotal(subtotal.subtract(venda.getDesconto()));

        for (PagamentoVendaDTO pagDTO : dto.pagamentos()) {
            PagamentoVenda pagamento = new PagamentoVenda();
            pagamento.setMetodo(pagDTO.metodo());
            pagamento.setValor(pagDTO.valor());
            pagamento.setParcelas(pagDTO.parcelas());
            venda.getPagamentos().add(pagamento);

            if ("A_PRAZO".equals(pagDTO.metodo())) {
                processarVendaAPrazo(venda, dto.parceiroId());
            } else {
                caixaService.adicionarVendaAoCaixa(pagDTO.metodo(), pagDTO.valor());
                financeiroService.registrarEntradaImediata(pagDTO.valor(), pagDTO.metodo());
            }
        }

        Venda salva = vendaRepository.save(venda);
        auditoriaService.registrar("PDV", "VENDA", "Venda #" + salva.getId() + " realizada no valor de R$ " + salva.getValorTotal());
        return salva;
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
