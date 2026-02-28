package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class FinanceiroService {

    @Autowired private ContaReceberRepository recebaRepo;
    @Autowired private ContaPagarRepository pagarRepo;
    @Autowired private MovimentacaoCaixaRepository caixaRepo;

    @Transactional
    public void baixarTitulo(Long contaId) {
        // ... (código existente)
    }

    @Transactional
    public void registrarEntradaImediata(BigDecimal valor, String metodo) {
        // ... (código existente)
    }

    @Transactional
    public void gerarContaReceberCartao(BigDecimal valor, Integer parcelas) {
        // ... (código existente)
    }

    @Transactional
    public void gerarContaPagar(String fornecedor, BigDecimal valor, LocalDateTime dataVencimento) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao("Compra de Mercadoria - NF");
        conta.setFornecedorNome(fornecedor); // Simplificado, idealmente seria um FK
        conta.setValorOriginal(valor);
        conta.setDataVencimento(dataVencimento.plusDays(30)); // Vencimento padrão de 30 dias
        conta.setStatus(StatusFinanceiro.PENDENTE);
        pagarRepo.save(conta);
    }
}
