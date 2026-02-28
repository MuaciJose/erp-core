package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.ContaReceberDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceiroService {

    @Autowired private ContaReceberRepository recebaRepo;
    @Autowired private ContaPagarRepository pagarRepo;
    @Autowired private MovimentacaoCaixaRepository caixaRepo;

    public List<ContaReceberDTO> listarContasAReceber() {
        return recebaRepo.findByStatus(StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaReceberDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void baixarTitulo(Long contaId) {
        // ... (código existente)
    }

    @Transactional
    public void registrarEntradaImediata(BigDecimal valor, String metodo) {
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Recebimento de Venda via " + metodo);
        mov.setValor(valor);
        mov.setTipo("ENTRADA");
        mov.setCategoria("VENDA_PDV");
        caixaRepo.save(mov);
    }

    @Transactional
    public void gerarContaReceberCartao(BigDecimal valor, Integer parcelas) {
        for (int i = 1; i <= parcelas; i++) {
            ContaReceber conta = new ContaReceber();
            conta.setDescricao("Venda Cartão PDV " + i + "/" + parcelas);
            conta.setValorOriginal(valor.divide(BigDecimal.valueOf(parcelas)));
            conta.setDataVencimento(LocalDateTime.now().plusDays(30 * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);
            recebaRepo.save(conta);
        }
    }

    @Transactional
    public void gerarContaReceberPrazo(BigDecimal valor, Parceiro cliente) {
        ContaReceber conta = new ContaReceber();
        conta.setDescricao("Venda a Prazo - PDV");
        conta.setParceiro(cliente); // Vincula a conta ao cliente
        conta.setValorOriginal(valor);
        conta.setDataVencimento(LocalDateTime.now().plusDays(30)); // Vencimento padrão de 30 dias
        conta.setStatus(StatusFinanceiro.PENDENTE);
        recebaRepo.save(conta);
    }

    @Transactional
    public void gerarContaPagar(String fornecedor, BigDecimal valor, LocalDateTime dataVencimento) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao("Compra de Mercadoria - NF");
        conta.setFornecedorNome(fornecedor);
        conta.setValorOriginal(valor);
        conta.setDataVencimento(dataVencimento.plusDays(30));
        conta.setStatus(StatusFinanceiro.PENDENTE);
        pagarRepo.save(conta);
    }
}
