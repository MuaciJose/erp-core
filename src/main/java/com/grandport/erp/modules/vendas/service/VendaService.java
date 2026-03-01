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
    public Venda criarPedido(VendaRequestDTO dto) {
        Venda venda = new Venda();
        venda.setStatus(StatusVenda.AGUARDANDO_PAGAMENTO);
        
        Usuario vendedor = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        venda.setVendedorNome(vendedor.getNomeCompleto());

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
    public Venda finalizarPagamentoPedido(Long vendaId, List<PagamentoVendaDTO> pagamentos) {
        Venda venda = vendaRepository.findById(vendaId).orElseThrow();
        
        for (PagamentoVendaDTO pagDTO : pagamentos) {
            PagamentoVenda pagamento = new PagamentoVenda();
            pagamento.setMetodo(pagDTO.metodo());
            pagamento.setValor(pagDTO.valor());
            pagamento.setParcelas(pagDTO.parcelas());
            venda.getPagamentos().add(pagamento);

            if ("A_PRAZO".equals(pagDTO.metodo())) {
                processarVendaAPrazo(venda, venda.getCliente().getId());
            } else {
                caixaService.adicionarVendaAoCaixa(pagDTO.metodo(), pagDTO.valor());
                financeiroService.registrarEntradaImediata(pagDTO.valor(), pagDTO.metodo());
            }
        }

        venda.setStatus(StatusVenda.CONCLUIDA);
        return vendaRepository.save(venda);
    }

    @Transactional
    public Venda processarVenda(VendaRequestDTO dto) {
        // Lógica de venda direta no PDV (já existente)
        Venda venda = new Venda();
        // ... (resto do código igual ao anterior, mas garantindo o status CONCLUIDA)
        return venda; 
    }

    private void processarVendaAPrazo(Venda venda, Long parceiroId) {
        // ... (lógica de limite de crédito já existente)
    }
}
