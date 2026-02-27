package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class FinanceiroService {

    @Autowired private ContaReceberRepository recebaRepo;
    @Autowired private MovimentacaoCaixaRepository caixaRepo;

    @Transactional
    public void baixarTitulo(Long contaId) {
        ContaReceber conta = recebaRepo.findById(contaId)
            .orElseThrow(() -> new RuntimeException("Título não encontrado"));

        if (conta.getStatus() == StatusFinanceiro.PAGO) {
            throw new RuntimeException("Título já está liquidado.");
        }

        // 1. Atualiza o título
        conta.setStatus(StatusFinanceiro.PAGO);
        conta.setDataPagamento(LocalDateTime.now());
        conta.setValorPago(conta.getValorOriginal());
        recebaRepo.save(conta);

        // 2. Registra no Fluxo de Caixa (Auditoria)
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Recebimento Título #" + conta.getId() + " - " + conta.getClienteNome());
        mov.setValor(conta.getValorOriginal());
        mov.setTipo("ENTRADA");
        mov.setCategoria("VENDA_AUTOPEÇAS");
        caixaRepo.save(mov);
    }
}
