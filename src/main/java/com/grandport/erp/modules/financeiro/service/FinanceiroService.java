package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.financeiro.dto.*;
import com.grandport.erp.modules.financeiro.model.*;
import com.grandport.erp.modules.financeiro.repository.*;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // ✅ HELPER: Obter empresa atual do usuário autenticado
    private Long obterEmpresaAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.grandport.erp.modules.usuario.model.Usuario) {
            com.grandport.erp.modules.usuario.model.Usuario usuario = 
                (com.grandport.erp.modules.usuario.model.Usuario) auth.getPrincipal();
            Long empresaId = usuario.getEmpresaId();
            if (empresaId != null) {
                return empresaId;
            }
        }
        throw new RuntimeException("Usuário não autenticado ou empresa não configurada");
    }

    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    public List<ContaReceberDTO> listarContasAReceber() {
        Long empresaId = obterEmpresaAtual();
        return recebaRepo.findByEmpresaIdAndStatusOrderByDataVencimentoAsc(empresaId, StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaReceberDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    public List<ContaPagarDTO> listarContasAPagar() {
        Long empresaId = obterEmpresaAtual();
        return pagarRepo.findByEmpresaIdAndStatus(empresaId, StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaPagarDTO::new)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> listarTodasAsContasPagar() {
        Long empresaId = obterEmpresaAtual();
        return pagarRepo.findByEmpresaIdOrderByDataVencimentoDesc(empresaId)
                .stream()
                .map(conta -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", conta.getId());
                    map.put("fornecedorNome", conta.getParceiro() != null && conta.getParceiro().getNome() != null
                            ? conta.getParceiro().getNome()
                            : "Diversos");
                    map.put("descricao", conta.getDescricao() != null ? conta.getDescricao() : "");
                    map.put("valor", conta.getValorOriginal() != null ? conta.getValorOriginal().doubleValue() : 0.0);
                    map.put("dataVencimento", conta.getDataVencimento());
                    map.put("dataPagamento", conta.getDataPagamento());

                    String status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";
                    map.put("status", status);
                    map.put("atrasado", conta.getDataVencimento() != null
                            && !status.contains("PAG")
                            && !status.contains("LIQUID")
                            && conta.getDataVencimento().isBefore(LocalDateTime.now()));
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<ContaReceberDTO> listarTodasAsContasReceber() {
        Long empresaId = obterEmpresaAtual();
        return recebaRepo.findByEmpresaIdOrderByDataVencimentoDesc(empresaId)
                .stream()
                .map(ContaReceberDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa E contas ativas
    public List<ContaBancaria> listarContasBancarias() {
        Long empresaId = obterEmpresaAtual();
        // Filtrar: empresa_id = atual AND ativo = true (soft delete)
        return bancoRepo.findByEmpresaIdAndAtivoTrue(empresaId);
    }

    @Transactional
    public ContaBancaria criarContaBancaria(ContaBancaria conta) {
        Long empresaId = obterEmpresaAtual();
        conta.setEmpresaId(empresaId);  // ✅ Setando empresa
        ContaBancaria salva = bancoRepo.save(conta);
        auditoriaService.registrar("FINANCEIRO", "CRIACAO_CONTA", "Criou a conta bancária: " + salva.getNome());
        return salva;
    }

    @Transactional
    public ContaBancaria atualizarContaBancaria(Long contaId, ContaBancaria dadosAtualizados) {
        Long empresaId = obterEmpresaAtual();
        
        // ✅ Validar que a conta pertence à empresa atual
        ContaBancaria contaBanco = bancoRepo.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta bancária não encontrada ou pertence a outra empresa."));
        
        // ✅ Proteger contra tentativa de alterar empresa
        if (dadosAtualizados.getEmpresaId() != null && !dadosAtualizados.getEmpresaId().equals(empresaId)) {
            throw new SecurityException("Tentativa de violação: não é permitido alterar a empresa da conta.");
        }
        
        // ✅ Atualizar apenas os campos permitidos (não alterar saldo via edição)
        contaBanco.setNome(dadosAtualizados.getNome());
        contaBanco.setTipo(dadosAtualizados.getTipo());
        contaBanco.setNumeroBanco(dadosAtualizados.getNumeroBanco());
        contaBanco.setAgencia(dadosAtualizados.getAgencia());
        contaBanco.setNumeroConta(dadosAtualizados.getNumeroConta());
        contaBanco.setDigitoConta(dadosAtualizados.getDigitoConta());
        contaBanco.setCarteira(dadosAtualizados.getCarteira());
        contaBanco.setConvenio(dadosAtualizados.getConvenio());
        contaBanco.setTipoCnab(dadosAtualizados.getTipoCnab());
        contaBanco.setNossoNumeroAtual(dadosAtualizados.getNossoNumeroAtual());
        
        ContaBancaria atualizada = bancoRepo.save(contaBanco);
        auditoriaService.registrar("FINANCEIRO", "ATUALIZACAO_CONTA", "Atualizou a conta bancária: " + atualizada.getNome());
        return atualizada;
    }

    @Transactional
    public void excluirContaBancaria(Long contaId) {
        Long empresaId = obterEmpresaAtual();
        
        // ✅ Validar que a conta pertence à empresa atual
        ContaBancaria conta = bancoRepo.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta bancária não encontrada ou pertence a outra empresa."));
        
        // ✅ Não permitir excluir conta com saldo diferente de zero
        if (conta.getSaldoAtual() != null && conta.getSaldoAtual().compareTo(java.math.BigDecimal.ZERO) != 0) {
            throw new RuntimeException("Não é permitido excluir conta com saldo. Zere o saldo antes de excluir.");
        }
        
        String nomeConta = conta.getNome();
        
        // ✅ SOFT DELETE: Ao invés de deletar, marca como inativo
        conta.setAtivo(false);
        conta.setDataDelecao(java.time.LocalDateTime.now());
        
        // Obter usuário atual autenticado
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String usuarioDelecao = auth != null ? auth.getName() : "SISTEMA";
        conta.setUsuarioDelecao(usuarioDelecao);
        
        bancoRepo.save(conta);
        auditoriaService.registrar("FINANCEIRO", "EXCLUSAO_CONTA", 
            "Deletou (soft delete) a conta bancária: " + nomeConta + " | Usuário: " + usuarioDelecao);
    }

    @Transactional
    public void transferirEntreContas(TransferenciaDTO dto) {
        Long empresaId = obterEmpresaAtual();
        // ✅ Validar que ambas as contas pertencem à empresa atual
        ContaBancaria origem = bancoRepo.findByEmpresaIdAndId(empresaId, dto.getContaOrigemId())
                .orElseThrow(() -> new RuntimeException("Conta de origem não encontrada ou pertence a outra empresa."));
        ContaBancaria destino = bancoRepo.findByEmpresaIdAndId(empresaId, dto.getContaDestinoId())
                .orElseThrow(() -> new RuntimeException("Conta de destino não encontrada ou pertence a outra empresa."));

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
        mov.setEmpresaId(empresaId);  // ✅ Setando empresa
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "TRANSFERENCIA", "Transferiu R$ " + dto.getValor() + " de " + origem.getNome() + " para " + destino.getNome());
    }

    @Transactional
    public void baixarContaPagar(Long contaId) {
        Long empresaId = obterEmpresaAtual();
        // ✅ Validar que a conta pertence à empresa atual
        ContaPagar conta = pagarRepo.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta a pagar não encontrada ou pertence a outra empresa: ID " + contaId));

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
        mov.setEmpresaId(empresaId);  // ✅ Setando empresa
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "BAIXA_PAGAR", "Baixou a conta: " + conta.getDescricao() + " no valor de R$ " + conta.getValorOriginal());
    }

    @Transactional
    public void liquidarContaPagar(Long contaId, Long bancoId) {
        Long empresaId = obterEmpresaAtual();
        // ✅ Validar que ambas pertencem à empresa atual
        ContaPagar conta = pagarRepo.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta a pagar não encontrada ou pertence a outra empresa: ID " + contaId));

        ContaBancaria banco = bancoRepo.findByEmpresaIdAndId(empresaId, bancoId)
                .orElseThrow(() -> new RuntimeException("Conta bancária não encontrada ou pertence a outra empresa: ID " + bancoId));

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
        mov.setEmpresaId(empresaId);  // ✅ Setando empresa
        caixaRepo.save(mov);

        auditoriaService.registrar("FINANCEIRO", "LIQUIDACAO", "Liquidou a conta: " + conta.getDescricao() + " via " + banco.getNome());
    }

    @Transactional
    public ContaPagar registrarDespesaManual(DespesaManualDTO dto) {
        Long empresaId = obterEmpresaAtual();
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(dto.getDescricao());
        conta.setValorOriginal(dto.getValor());
        conta.setDataVencimento(dto.getVencimento().atStartOfDay());
        conta.setStatus(StatusFinanceiro.PENDENTE);
        conta.setEmpresaId(empresaId);  // ✅ Setando empresa

        if (dto.getPlanoContaId() != null) {
            // ✅ Validar que o plano pertence à empresa atual
            PlanoConta pc = planoRepo.findByEmpresaIdAndId(empresaId, dto.getPlanoContaId())
                    .orElseThrow(() -> new RuntimeException("Plano de conta não encontrado ou pertence a outra empresa."));
            conta.setPlanoConta(pc);
        }

        parceiroRepository.findByEmpresaIdAndNome(empresaId, dto.getFornecedor()).ifPresent(conta::setParceiro);
        ContaPagar salva = pagarRepo.save(conta);
        auditoriaService.registrar("FINANCEIRO", "CRIACAO_DESPESA", "Registrou despesa manual: " + salva.getDescricao() + " no valor de R$ " + dto.getValor());
        return salva;
    }

    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    public DreDTO calcularDre(YearMonth mesAno) {
        Long empresaId = obterEmpresaAtual();
        LocalDateTime inicioMes = mesAno.atDay(1).atStartOfDay();
        LocalDateTime fimMes = mesAno.atEndOfMonth().atTime(23, 59, 59);

        DreDTO dre = new DreDTO();
        // TODO: Atualizar VendaRepository com métodos sumTotalVendasPeriodoEmpresa, sumTotalDescontosPeriodoEmpresa, sumCmvPeriodoEmpresa
        // Por enquanto, usar métodos antigos (sem filtro de empresa)
        dre.setReceitaBruta(vendaRepository.sumTotalVendasPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));
        dre.setDevolucoesDescontos(vendaRepository.sumTotalDescontosPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));
        dre.setCmv(vendaRepository.sumCmvPeriodoEmpresa(inicioMes, fimMes, empresaId).orElse(BigDecimal.ZERO));

        List<DespesaPorPlanoContaDTO> despesasAgrupadas = pagarRepo.sumDespesasPagasAgrupadasPorPlanoConta(empresaId, inicioMes, fimMes);
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
        Long empresaId = obterEmpresaAtual();
        ContaPagar conta = new ContaPagar();
        conta.setDescricao(descricao);
        conta.setParceiro(fornecedor);
        conta.setValorOriginal(valor);
        conta.setDataVencimento(dataVencimento);
        conta.setStatus(StatusFinanceiro.PENDENTE);
        conta.setEmpresaId(empresaId);  // ✅ Setando empresa

        ContaPagar salva = pagarRepo.save(conta);

        auditoriaService.registrar("FINANCEIRO", "GERACAO_PAGAR", "Gerou conta a pagar (ID: " + salva.getId() + ") para '" + (fornecedor != null ? fornecedor.getNome() : "Desconhecido") + "' no valor de R$ " + valor);

        return salva;
    }

    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    public ExtratoParceiroDTO gerarExtratoParceiro(Long parceiroId) {
        Long empresaId = obterEmpresaAtual();
        Parceiro parceiro = parceiroRepository.findByEmpresaIdAndId(empresaId, parceiroId)
                .orElseThrow(() -> new RuntimeException("Parceiro não encontrado: ID " + parceiroId));

        List<ContaReceberDTO> contas = recebaRepo.findByEmpresaIdAndParceiroIdAndStatus(empresaId, parceiroId, StatusFinanceiro.PENDENTE)
                .stream()
                .map(ContaReceberDTO::new)
                .collect(Collectors.toList());

        return new ExtratoParceiroDTO(parceiro, contas);
    }

    @Transactional
    public void registrarEntradaImediata(BigDecimal valor, String metodo) {
        Long empresaId = obterEmpresaAtual();
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao("Recebimento de Venda via " + metodo);
        mov.setValor(valor);
        mov.setTipo("ENTRADA");
        mov.setCategoria("VENDA_PDV");
        mov.setEmpresaId(empresaId);  // ✅ Setando empresa
        caixaRepo.save(mov);

        auditoriaService.registrar("CAIXA", "ENTRADA_AVULSA", "Entrada imediata de R$ " + valor + " via " + metodo);
    }

    // =========================================================================
    // 🚀 LÓGICA DE CARTÃO DE CRÉDITO (BLINDADA COM NOME NA DESCRIÇÃO)
    // =========================================================================
    @Transactional
    public void gerarContaReceberCartao(BigDecimal valor, Integer parcelas, Parceiro cliente, String referencia) {
        Long empresaId = obterEmpresaAtual();
        if (parcelas == null || parcelas < 1) parcelas = 1;

        String nomeCliente = cliente != null ? cliente.getNome() : "Consumidor Final";

        for (int i = 1; i <= parcelas; i++) {
            ContaReceber conta = new ContaReceber();

            if (cliente != null) {
                conta.setParceiro(cliente);
            }

            conta.setDescricao("Cartão " + i + "/" + parcelas + " - " + nomeCliente + " (" + referencia + ")");

            conta.setValorOriginal(valor.divide(BigDecimal.valueOf(parcelas), 2, RoundingMode.HALF_UP));
            conta.setDataVencimento(java.time.LocalDateTime.now().plusDays(30L * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);
            conta.setEmpresaId(empresaId);  // ✅ Setando empresa

            recebaRepo.save(conta);
        }

        auditoriaService.registrar("FINANCEIRO", "GERACAO_RECEBER_CARTAO", "Gerou " + parcelas + " parcela(s) no Cartão (Ref: " + referencia + ") do cliente '" + nomeCliente + "' totalizando R$ " + valor);
    }

    // =========================================================================
    // 🚀 1. LÓGICA DE PROMISSÓRIAS (PARA VENDAS DE BALCÃO/PDV)
    // =========================================================================
    @Transactional
    public void gerarContaReceberPrazo(Venda venda, Parceiro cliente, Integer parcelas) {
        Long empresaId = obterEmpresaAtual();
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
            conta.setEmpresaId(empresaId);  // ✅ Setando empresa

            recebaRepo.save(conta);
        }

        String nomeCliente = cliente != null ? cliente.getNome() : "Desconhecido";
        auditoriaService.registrar("FINANCEIRO", "GERACAO_PROMISSORIAS", "Gerou " + parcelas + " promissória(s) para o cliente '" + nomeCliente + "' ref. Venda #" + venda.getId() + " totalizando R$ " + venda.getValorTotal());
    }

    // =========================================================================
    // 🚀 2. LÓGICA DE PROMISSÓRIAS EXCLUSIVA (PARA ORDEM DE SERVIÇO - OS)
    // =========================================================================
    @Transactional
    public void gerarContaReceberPrazoOS(OrdemServico os, Parceiro cliente, Integer parcelas, BigDecimal valorTotalPrazo) {
        Long empresaId = obterEmpresaAtual();
        if (cliente == null) throw new RuntimeException("Cliente não informado para faturamento a prazo da OS.");
        if (parcelas == null || parcelas < 1) parcelas = 1;

        int intervaloDias = (cliente.getIntervaloDiasPagamento() != null && cliente.getIntervaloDiasPagamento() > 0)
                ? cliente.getIntervaloDiasPagamento() : 30;

        BigDecimal valorParcela = valorTotalPrazo.divide(new BigDecimal(parcelas), 2, RoundingMode.HALF_UP);

        for (int i = 1; i <= parcelas; i++) {
            ContaReceber conta = new ContaReceber();
            conta.setParceiro(cliente);
            conta.setDescricao("Parcela " + i + "/" + parcelas + " - OS #" + os.getId());
            conta.setValorOriginal(valorParcela);
            conta.setDataVencimento(LocalDateTime.now().plusDays((long) intervaloDias * i));
            conta.setStatus(StatusFinanceiro.PENDENTE);
            conta.setEmpresaId(empresaId);  // ✅ Setando empresa

            recebaRepo.save(conta);
        }

        String nomeCliente = cliente.getNome();
        auditoriaService.registrar("FINANCEIRO", "GERACAO_PROMISSORIAS_OS", "Gerou " + parcelas + " promissória(s) para cliente '" + nomeCliente + "' ref. OS #" + os.getId() + " totalizando R$ " + valorTotalPrazo);
    }

    // =========================================================================
    // 🚀 NOVO: LISTAR CONTAS PENDENTES PARA O FRONT-END DO CAIXA
    // =========================================================================
    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    public List<Map<String, Object>> listarContasReceberPendentes() {
        Long empresaId = obterEmpresaAtual();
        List<ContaReceber> contas = recebaRepo.findByEmpresaIdAndStatusOrderByDataVencimentoAsc(empresaId, StatusFinanceiro.PENDENTE);
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
    // ✅ MULTI-EMPRESA: Atualizado para filtrar por empresa
    @Transactional
    public void baixarContaReceber(Long contaId, Map<String, Object> payload) {
        Long empresaId = obterEmpresaAtual();
        // ✅ Validar que a conta pertence à empresa atual
        ContaReceber conta = recebaRepo.findByEmpresaIdAndId(empresaId, contaId)
                .orElseThrow(() -> new RuntimeException("Conta não encontrada ou pertence a outra empresa."));

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
        mov.setEmpresaId(empresaId);  // ✅ Setando empresa
        caixaRepo.save(mov);

        // 🚀 AUDITORIA: Melhorada para exibir informações cruciais
        String nomeCliente = cliente != null ? cliente.getNome() : "Desconhecido";
        String detalhesLog = String.format("Baixou conta a receber (ID: %d) de '%s' via %s. Valor Original: R$ %s | Valor Recebido: R$ %s",
                contaId, nomeCliente, metodo, conta.getValorOriginal(), valorRecebido);

        auditoriaService.registrar("FINANCEIRO", "BAIXA_RECEBER", detalhesLog);
    }

    // 🟦 MÉTODO AUXILIAR: Busca um Parceiro por ID (necessário para Extratos)
    public java.util.Optional<Parceiro> findParceiro(Long parceiroId) {
        return parceiroRepository.findByEmpresaIdAndId(obterEmpresaAtual(), parceiroId);
    }
}
