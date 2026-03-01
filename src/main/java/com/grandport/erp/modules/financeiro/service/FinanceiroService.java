package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.*;
import com.grandport.erp.modules.financeiro.repository.*;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FinanceiroService {

    @Autowired private ContaReceberRepository recebaRepo;
    @Autowired private ContaPagarRepository pagarRepo;
    @Autowired private MovimentacaoCaixaRepository caixaRepo;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private VendaRepository vendaRepository;
    @Autowired private ContaBancariaRepository bancoRepo;
    @Autowired private PlanoContaRepository planoRepo;
    @Autowired private AuditoriaService auditoriaService;

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

    public List<ContaBancaria> listarContasBancarias() {
        return bancoRepo.findAll();
    }

    @Transactional
    public ContaBancaria criarContaBancaria(ContaBancaria conta) {
        ContaBancaria salva = bancoRepo.save(conta);
        auditoriaService.registrar("FINANCEIRO", "CRIACAO_CONTA", "Criou a conta bancária: " + salva.getNome());
        return salva;
    }

    @Transactional
    public void transferirEntreContas(TransferenciaDTO dto) {
        ContaBancaria origem = bancoRepo.findById(dto.getContaOrigemId())
            .orElseThrow(() -> new RuntimeException("Conta de origem não encontrada."));
        ContaBancaria destino = bancoRepo.findById(dto.getContaDestinoId())
            .orElseThrow(() -> new RuntimeException("Conta de destino não encontrada."));

        if (origem.getSaldoAtual().compareTo(dto.getValor()) < 0) {
            throw new RuntimeException("Saldo insuficiente na conta de origem.");
        }

        origem.setSaldoAtual(origem.getSaldoAtual().subtract(dto.getValor()));
        destino.setSaldoAtual(destino.getSaldoAtual().add(dto.getValor()));

        bancoRepo.save(origem);
        bancoRepo.save(destino);

        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Transferência: " + origem.getNome() + " -> " + destino.getNome());
        mov.setValor(dto.getValor());
        mov.setTipo("TRANSFERENCIA");
        mov.setCategoria("TESOURARIA");
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "TRANSFERENCIA", "Transferiu R$ " + dto.getValor() + " de " + origem.getNome() + " para " + destino.getNome());
    }

    @Transactional
    public void baixarContaPagar(Long contaId) {
        ContaPagar conta = pagarRepo.findById(contaId)
            .orElseThrow(() -> new RuntimeException("Conta a pagar não encontrada: ID " + contaId));

        if (conta.getStatus() == StatusFinanceiro.PAGO) throw new RuntimeException("Esta conta já foi paga.");

        conta.setStatus(StatusFinanceiro.PAGO);
        conta.setDataPagamento(LocalDateTime.now());
        conta.setValorPago(conta.getValorOriginal());
        pagarRepo.save(conta);

        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Pagamento: " + conta.getDescricao());
        mov.setValor(conta.getValorOriginal().negate());
        mov.setTipo("SAIDA");
        mov.setCategoria("PAGAMENTO_DESPESA");
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "BAIXA_PAGAR", "Baixou a conta: " + conta.getDescricao() + " no valor de R$ " + conta.getValorOriginal());
    }

    @Transactional
    public void liquidarContaPagar(Long contaId, Long bancoId) {
        ContaPagar conta = pagarRepo.findById(contaId)
            .orElseThrow(() -> new RuntimeException("Conta a pagar não encontrada: ID " + contaId));
        
        ContaBancaria banco = bancoRepo.findById(bancoId)
            .orElseThrow(() -> new RuntimeException("Conta bancária não encontrada: ID " + bancoId));

        if (conta.getStatus() == StatusFinanceiro.PAGO) throw new RuntimeException("Esta conta já foi paga.");

        banco.setSaldoAtual(banco.getSaldoAtual().subtract(conta.getValorOriginal()));
        bancoRepo.save(banco);

        conta.setStatus(StatusFinanceiro.PAGO);
        conta.setDataPagamento(LocalDateTime.now());
        conta.setValorPago(conta.getValorOriginal());
        pagarRepo.save(conta);

        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Pagamento via " + banco.getNome() + ": " + conta.getDescricao());
        mov.setValor(conta.getValorOriginal().negate());
        mov.setTipo("SAIDA");
        mov.setCategoria("PAGAMENTO_DESPESA");
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "LIQUIDACAO", "Liquidou a conta: " + conta.getDescricao() + " via " + banco.getNome());
    }

    @Transactional
    public ContaPagar registrarDespesaManual(DespesaManualDTO dto) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(dto.getDescricao());
        conta.setValorOriginal(dto.getValor());
        conta.setDataVencimento(dto.getVencimento().atStartOfDay());
        conta.setStatus(StatusFinanceiro.PENDENTE);
        
        if (dto.getPlanoContaId() != null) {
            PlanoConta pc = planoRepo.findById(dto.getPlanoContaId())
                .orElseThrow(() -> new RuntimeException("Plano de conta não encontrado."));
            conta.setPlanoConta(pc);
        }

        parceiroRepository.findByNome(dto.getFornecedor()).ifPresent(conta::setParceiro);
        ContaPagar salva = pagarRepo.save(conta);
        auditoriaService.registrar("FINANCEIRO", "CRIACAO_DESPESA", "Registrou despesa manual: " + salva.getDescricao());
        return salva;
    }

    // ... outros métodos ...

    public ExtratoParceiroDTO gerarExtratoParceiro(Long parceiroId) {
        Parceiro parceiro = parceiroRepository.findById(parceiroId)
            .orElseThrow(() -> new RuntimeException("Parceiro não encontrado: ID " + parceiroId));
        
        List<ContaReceberDTO> contas = recebaRepo.findByParceiroIdAndStatus(parceiroId, StatusFinanceiro.PENDENTE)
            .stream()
            .map(ContaReceberDTO::new)
            .collect(Collectors.toList());
            
        return new ExtratoParceiroDTO(parceiro, contas);
    }

    public DreDTO calcularDre(YearMonth mesAno) {
        LocalDateTime inicioMes = mesAno.atDay(1).atStartOfDay();
        LocalDateTime fimMes = mesAno.atEndOfMonth().atTime(23, 59, 59);

        DreDTO dre = new DreDTO();
        dre.setReceitaBruta(vendaRepository.sumTotalVendasPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));
        dre.setDevolucoesDescontos(vendaRepository.sumTotalDescontosPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));
        dre.setCmv(vendaRepository.sumCmvPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));

        BigDecimal totalDespesasPagas = pagarRepo.sumDespesasPagasPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO);
        
        Map<String, BigDecimal> despesasCategorizadas = new HashMap<>();
        despesasCategorizadas.put("salarios", totalDespesasPagas.multiply(new BigDecimal("0.30")));
        despesasCategorizadas.put("aluguel", totalDespesasPagas.multiply(new BigDecimal("0.20")));
        despesasCategorizadas.put("impostos", totalDespesasPagas.multiply(new BigDecimal("0.25")));
        despesasCategorizadas.put("marketing", totalDespesasPagas.multiply(new BigDecimal("0.10")));
        despesasCategorizadas.put("outros", totalDespesasPagas.multiply(new BigDecimal("0.15")));
        
        dre.setDespesasOperacionais(despesasCategorizadas);

        return dre;
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
        conta.setParceiro(cliente);
        conta.setValorOriginal(valor);
        conta.setDataVencimento(LocalDateTime.now().plusDays(30));
        conta.setStatus(StatusFinanceiro.PENDENTE);
        recebaRepo.save(conta);
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
