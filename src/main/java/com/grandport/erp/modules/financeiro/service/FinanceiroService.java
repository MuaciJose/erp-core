package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.ContaPagarDTO;
import com.grandport.erp.modules.financeiro.dto.ContaReceberDTO;
import com.grandport.erp.modules.financeiro.dto.DespesaManualDTO;
import com.grandport.erp.modules.financeiro.dto.ExtratoParceiroDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import com.grandport.erp.modules.financeiro.repository.ContaPagarRepository;
import com.grandport.erp.modules.financeiro.repository.ContaReceberRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
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
    @Autowired private ParceiroRepository parceiroRepository;

    public List<ContaReceberDTO> listarContasAReceber() {
        return recebaRepo.findByStatus(StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaReceberDTO::new)
                .collect(Collectors.toList());
    }

    public List<ContaPagarDTO> listarContasAPagar() {
        return pagarRepo.findByStatus(StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaPagarDTO::new)
                .collect(Collectors.toList());
    }

    public ExtratoParceiroDTO gerarExtratoParceiro(Long parceiroId) {
        Parceiro parceiro = parceiroRepository.findById(parceiroId)
            .orElseThrow(() -> new RuntimeException("Parceiro não encontrado: ID " + parceiroId));
        
        List<ContaReceberDTO> contas = recebaRepo.findByParceiroIdAndStatus(parceiroId, StatusFinanceiro.PENDENTE)
            .stream()
            .map(ContaReceberDTO::new)
            .collect(Collectors.toList());
            
        return new ExtratoParceiroDTO(parceiro, contas);
    }

    @Transactional
    public void baixarContaPagar(Long contaId) {
        ContaPagar conta = pagarRepo.findById(contaId)
            .orElseThrow(() -> new RuntimeException("Conta a pagar não encontrada: ID " + contaId));

        if (conta.getStatus() == StatusFinanceiro.PAGO) {
            throw new RuntimeException("Esta conta já foi paga.");
        }

        conta.setStatus(StatusFinanceiro.PAGO);
        conta.setDataPagamento(LocalDateTime.now());
        conta.setValorPago(conta.getValorOriginal()); // Simplificado, poderia ter juros/multa
        pagarRepo.save(conta);

        // Registra a saída no caixa
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Pagamento: " + conta.getDescricao());
        mov.setValor(conta.getValorOriginal().negate()); // Valor negativo para saída
        mov.setTipo("SAIDA");
        mov.setCategoria("PAGAMENTO_DESPESA");
        caixaRepo.save(mov);
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
    public ContaPagar registrarDespesaManual(DespesaManualDTO dto) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(dto.getDescricao());
        conta.setValorOriginal(dto.getValor());
        conta.setDataVencimento(dto.getVencimento().atStartOfDay());
        conta.setStatus(StatusFinanceiro.PENDENTE);
        parceiroRepository.findByNome(dto.getFornecedor()).ifPresent(conta::setParceiro);
        return pagarRepo.save(conta);
    }

    @Transactional
    public void gerarContaReceberCartao(BigDecimal valor, Integer parcelas) {
        // ... (código existente)
    }

    @Transactional
    public void gerarContaReceberPrazo(BigDecimal valor, Parceiro cliente) {
        // ... (código existente)
    }

    @Transactional
    public ContaPagar gerarContaPagar(Parceiro fornecedor, BigDecimal valor, LocalDateTime dataVencimento, String descricao) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(descricao);
        conta.setParceiro(fornecedor);
        conta.setValorOriginal(valor);
        conta.setDataVencimento(dataVencimento);
        conta.setStatus(StatusFinanceiro.PENDENTE);
        return pagarRepo.save(conta);
    }
}
