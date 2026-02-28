package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
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
    @Autowired private MovimentacaoCaixaRepository caixaRepo;

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
            conta.setClienteNome("Venda Cartão PDV");
            conta.setValorOriginal(valor.divide(BigDecimal.valueOf(parcelas)));
            conta.setDataVencimento(LocalDateTime.now().plusDays(30 * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);
            recebaRepo.save(conta);
        }
    }
}
