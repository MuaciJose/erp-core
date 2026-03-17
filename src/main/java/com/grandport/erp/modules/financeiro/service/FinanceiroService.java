package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.*;
import com.grandport.erp.modules.financeiro.repository.*;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
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

    // Motor de Auditoria já estava perfeitamente injetado por você!
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
        auditoriaService.registrar("FINANCEIRO", "CRIACAO_DESPESA", "Registrou despesa manual: " + salva.getDescricao() + " no valor de R$ " + dto.getValor());
        return salva;
    }

    public DreDTO calcularDre(YearMonth mesAno) {
        LocalDateTime inicioMes = mesAno.atDay(1).atStartOfDay();
        LocalDateTime fimMes = mesAno.atEndOfMonth().atTime(23, 59, 59);

        DreDTO dre = new DreDTO();
        dre.setReceitaBruta(vendaRepository.sumTotalVendasPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));
        dre.setDevolucoesDescontos(vendaRepository.sumTotalDescontosPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));
        dre.setCmv(vendaRepository.sumCmvPeriodo(inicioMes, fimMes).orElse(BigDecimal.ZERO));

        List<DespesaPorPlanoContaDTO> despesasAgrupadas = pagarRepo.sumDespesasPagasAgrupadasPorPlanoConta(inicioMes, fimMes);
        Map<String, BigDecimal> despesasOperacionais = despesasAgrupadas.stream()
                .collect(Collectors.toMap(
                        DespesaPorPlanoContaDTO::getDescricaoPlanoConta,
                        DespesaPorPlanoContaDTO::getTotalPago
                ));

        dre.setDespesasOperacionais(despesasOperacionais);

        return dre;
    }

    @Transactional
    public ContaPagar gerarContaPagar(Parceiro fornecedor, BigDecimal valor, LocalDateTime dataVencimento, String descricao) {
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(descricao);
        conta.setParceiro(fornecedor);
        conta.setValorOriginal(valor);
        conta.setDataVencimento(dataVencimento);
        conta.setStatus(StatusFinanceiro.PENDENTE);

        ContaPagar salva = pagarRepo.save(conta);

        // 🚀 AUDITORIA: Adicionada
        auditoriaService.registrar("FINANCEIRO", "GERACAO_PAGAR", "Gerou conta a pagar (ID: " + salva.getId() + ") para '" + (fornecedor != null ? fornecedor.getNome() : "Desconhecido") + "' no valor de R$ " + valor);

        return salva;
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
    public void registrarEntradaImediata(BigDecimal valor, String metodo) {
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Recebimento de Venda via " + metodo);
        mov.setValor(valor);
        mov.setTipo("ENTRADA");
        mov.setCategoria("VENDA_PDV");
        caixaRepo.save(mov);

        // 🚀 AUDITORIA: Adicionada
        auditoriaService.registrar("CAIXA", "ENTRADA_AVULSA", "Entrada imediata de R$ " + valor + " via " + metodo);
    }

    @Transactional
    public void gerarContaReceberCartao(BigDecimal valor, Integer parcelas) {
        for (int i = 1; i <= parcelas; i++) {
            ContaReceber conta = new ContaReceber();
            conta.setDescricao("Venda Cartão PDV " + i + "/" + parcelas);
            conta.setValorOriginal(valor.divide(BigDecimal.valueOf(parcelas), 2, RoundingMode.HALF_UP));
            conta.setDataVencimento(LocalDateTime.now().plusDays(30L * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);
            recebaRepo.save(conta);
        }

        // 🚀 AUDITORIA: Adicionada
        auditoriaService.registrar("FINANCEIRO", "GERACAO_RECEBER_CARTAO", "Gerou " + parcelas + " parcela(s) a receber em Cartão totalizando R$ " + valor);
    }

    // =========================================================================
    // 🚀 LÓGICA DE PROMISSÓRIAS (ATUALIZADA)
    // =========================================================================
    @Transactional
    public void gerarContaReceberPrazo(Venda venda, Parceiro cliente, Integer parcelas) {
        if (parcelas == null || parcelas < 1) parcelas = 1;

        int intervaloDias = (cliente.getIntervaloDiasPagamento() != null && cliente.getIntervaloDiasPagamento() > 0)
                ? cliente.getIntervaloDiasPagamento() : 30;

        BigDecimal valorParcela = venda.getValorTotal().divide(new BigDecimal(parcelas), 2, RoundingMode.HALF_UP);

        for (int i = 1; i <= parcelas; i++) {
            ContaReceber conta = new ContaReceber();
            conta.setVenda(venda);
            conta.setParceiro(cliente);
            conta.setDescricao("Parcela " + i + "/" + parcelas + " - Pedido #" + venda.getId());
            conta.setValorOriginal(valorParcela);
            conta.setDataVencimento(LocalDateTime.now().plusDays((long) intervaloDias * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);

            recebaRepo.save(conta);
        }

        // 🚀 AUDITORIA: CRÍTICA! Adicionada para rastrear geração de fiado/promissórias
        String nomeCliente = cliente != null ? cliente.getNome() : "Desconhecido";
        auditoriaService.registrar("FINANCEIRO", "GERACAO_PROMISSORIAS", "Gerou " + parcelas + " promissória(s) para o cliente '" + nomeCliente + "' ref. Venda #" + venda.getId() + " totalizando R$ " + venda.getValorTotal());
    }

    // =========================================================================
    // 🚀 NOVO: LISTAR CONTAS PENDENTES PARA O FRONT-END DO CAIXA
    // =========================================================================
    public List<Map<String, Object>> listarContasReceberPendentes() {
        List<ContaReceber> contas = recebaRepo.findByStatus(StatusFinanceiro.PENDENTE);
        List<Map<String, Object>> resposta = new ArrayList<>();

        for (ContaReceber c : contas) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("parceiroNome", c.getParceiro() != null ? c.getParceiro().getNome() : "Cliente não informado");
            map.put("descricao", c.getDescricao());
            map.put("dataVencimento", c.getDataVencimento().toString());
            map.put("valor", c.getValorOriginal());

            boolean atrasado = c.getDataVencimento().isBefore(LocalDateTime.now());
            map.put("atrasado", atrasado);

            resposta.add(map);
        }
        return resposta;
    }

    // =========================================================================
    // 🚀 NOVO: BAIXAR CONTA (E RESTAURAR LIMITE DO CLIENTE)
    // =========================================================================
    @Transactional
    public void baixarContaReceber(Long contaId, Map<String, Object> payload) {
        ContaReceber conta = recebaRepo.findById(contaId)
                .orElseThrow(() -> new RuntimeException("Conta não encontrada."));

        if (conta.getStatus() == StatusFinanceiro.PAGO) {
            throw new RuntimeException("Esta conta já foi baixada anteriormente.");
        }

        BigDecimal valorRecebido = new BigDecimal(payload.getOrDefault("valorRecebido", conta.getValorOriginal()).toString());
        String metodo = payload.getOrDefault("metodoPagamento", "DINHEIRO").toString();

        conta.setStatus(StatusFinanceiro.PAGO);
        conta.setDataPagamento(LocalDateTime.now());
        conta.setValorPago(valorRecebido);

        Parceiro cliente = conta.getParceiro();
        if (cliente != null) {
            BigDecimal novoSaldo = cliente.getSaldoDevedor().subtract(conta.getValorOriginal());
            if(novoSaldo.compareTo(BigDecimal.ZERO) < 0) novoSaldo = BigDecimal.ZERO;

            cliente.setSaldoDevedor(novoSaldo);
            parceiroRepository.save(cliente);
        }

        recebaRepo.save(conta);

        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Recebimento C/R: " + conta.getDescricao() + " (" + metodo + ")");
        mov.setValor(valorRecebido);
        mov.setTipo("ENTRADA");
        mov.setCategoria("RECEBIMENTO_CONTA");
        caixaRepo.save(mov);

        // 🚀 AUDITORIA: Melhorada para exibir informações cruciais (se teve juros ou desconto)
        String nomeCliente = cliente != null ? cliente.getNome() : "Desconhecido";
        String detalhesLog = String.format("Baixou conta a receber (ID: %d) de '%s' via %s. Valor Original: R$ %s | Valor Recebido: R$ %s",
                contaId, nomeCliente, metodo, conta.getValorOriginal(), valorRecebido);

        auditoriaService.registrar("FINANCEIRO", "BAIXA_RECEBER", detalhesLog);
    }
}