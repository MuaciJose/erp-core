package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO;
import com.grandport.erp.modules.financeiro.model.CaixaDiario;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusCaixa;
import com.grandport.erp.modules.financeiro.repository.CaixaDiarioRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CaixaService {

    @Autowired private CaixaDiarioRepository caixaRepository;
    @Autowired private MovimentacaoCaixaRepository movimentacaoRepository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private EmpresaContextService empresaContextService;

    public CaixaDiarioDTO getCaixaAtual() {
        return caixaRepository.findByEmpresaIdAndStatus(empresaContextService.getRequiredEmpresaId(), StatusCaixa.ABERTO)
                .map(CaixaDiarioDTO::new)
                .orElse(new CaixaDiarioDTO());
    }

    @Transactional
    public CaixaDiario abrirCaixa(BigDecimal saldoInicial) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Optional<CaixaDiario> caixaAberto = caixaRepository.findByEmpresaIdAndStatus(empresaId, StatusCaixa.ABERTO);
        if (caixaAberto.isPresent()) throw new RuntimeException("Já existe um caixa aberto.");

        CaixaDiario novoCaixa = new CaixaDiario();
        novoCaixa.setDataAbertura(LocalDateTime.now());
        novoCaixa.setSaldoInicial(saldoInicial);
        novoCaixa.setStatus(StatusCaixa.ABERTO);
        novoCaixa.setEmpresaId(empresaId);

        // 🚀 CAPTURA QUEM ESTÁ LOGADO AGORA PARA SER O OPERADOR
        try {
            Usuario operador = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            String nomeParaSalvar = (operador.getNomeCompleto() != null && !operador.getNomeCompleto().trim().isEmpty())
                    ? operador.getNomeCompleto()
                    : operador.getUsername();

            novoCaixa.setOperadorNome(nomeParaSalvar);
        } catch (Exception e) {
            novoCaixa.setOperadorNome("Administrador"); // Salva-vidas caso não ache o usuário
        }

        registrarMovimentacao(novoCaixa, saldoInicial, "ENTRADA", "Fundo de Caixa (Abertura)");

        CaixaDiario salvo = caixaRepository.save(novoCaixa);

        // 🚀 AUDITORIA: Enriquecida com ID do caixa e Operador
        auditoriaService.registrar("CAIXA", "ABERTURA", "Abriu o caixa (ID: " + salvo.getId() + ") com fundo de troco inicial de R$ " + saldoInicial + " (Operador: " + salvo.getOperadorNome() + ")");

        return salvo;
    }

    @Transactional
    public CaixaDiario fecharCaixa(BigDecimal valorInformado) {
        CaixaDiario caixa = getCaixaAberto();
        caixa.setDataFechamento(LocalDateTime.now());
        caixa.setStatus(StatusCaixa.FECHADO);
        caixa.setValorInformadoFechamento(valorInformado);

        // 🚀 LÓGICA DE AUDITORIA VIP: Calcula se houve sobra ou falta de dinheiro na gaveta
        // Dinheiro Esperado = Saldo Inicial + Total Vendas Dinheiro - Total Sangrias
        BigDecimal totalEsperadoEmDinheiro = caixa.getSaldoInicial()
                .add(caixa.getTotalDinheiro() != null ? caixa.getTotalDinheiro() : BigDecimal.ZERO)
                .subtract(caixa.getTotalSangrias() != null ? caixa.getTotalSangrias() : BigDecimal.ZERO);

        BigDecimal diferenca = valorInformado.subtract(totalEsperadoEmDinheiro);

        String logFechamento = String.format("Fechou o caixa (ID: %d). Informado na gaveta: R$ %s | Esperado (Dinheiro): R$ %s",
                caixa.getId(), valorInformado, totalEsperadoEmDinheiro);

        if (diferenca.compareTo(BigDecimal.ZERO) != 0) {
            String tipoDiferenca = diferenca.compareTo(BigDecimal.ZERO) > 0 ? "SOBRA" : "QUEBRA/FALTA";
            logFechamento += String.format(" | ALERTA DE %s: R$ %s", tipoDiferenca, diferenca);
        }

        CaixaDiario salvo = caixaRepository.save(caixa);

        // 🚀 AUDITORIA: Salva o log inteligente
        auditoriaService.registrar("CAIXA", "FECHAMENTO", logFechamento);

        return salvo;
    }

    @Transactional
    public void registrarSangria(BigDecimal valor, String motivo) {
        CaixaDiario caixa = getCaixaAberto();

        // Prevenção de null pointer
        BigDecimal sangriasAtuais = caixa.getTotalSangrias() != null ? caixa.getTotalSangrias() : BigDecimal.ZERO;
        caixa.setTotalSangrias(sangriasAtuais.add(valor));

        registrarMovimentacao(caixa, valor.negate(), "SAIDA", motivo);
        caixaRepository.save(caixa);

        // 🚀 AUDITORIA: Enriquecida com ID
        auditoriaService.registrar("CAIXA", "SANGRIA", "Realizou sangria (retirada) de R$ " + valor + " no Caixa ID " + caixa.getId() + ". Motivo: " + motivo);
    }

    @Transactional
    public void adicionarVendaAoCaixa(String metodoPagamento, BigDecimal valor) {
        CaixaDiario caixa = getCaixaAberto();

        // Prevenções de NullPointer para garantir estabilidade máxima
        if (caixa.getTotalDinheiro() == null) caixa.setTotalDinheiro(BigDecimal.ZERO);
        if (caixa.getTotalCartao() == null) caixa.setTotalCartao(BigDecimal.ZERO);
        if (caixa.getTotalPix() == null) caixa.setTotalPix(BigDecimal.ZERO);

        switch (metodoPagamento.toUpperCase()) {
            case "DINHEIRO": caixa.setTotalDinheiro(caixa.getTotalDinheiro().add(valor)); break;
            case "CARTAO": caixa.setTotalCartao(caixa.getTotalCartao().add(valor)); break;
            case "PIX": caixa.setTotalPix(caixa.getTotalPix().add(valor)); break;
        }
        caixaRepository.save(caixa);

        // Nota: Não disparamos auditoria aqui para não superlotar o banco.
        // A venda detalhada será auditada pelo VendaService.
    }

    public CaixaDiario getCaixaAberto() {
        return caixaRepository.findByEmpresaIdAndStatus(empresaContextService.getRequiredEmpresaId(), StatusCaixa.ABERTO)
                .orElseThrow(() -> new RuntimeException("Nenhum caixa aberto no momento. Abra o caixa para realizar operações."));
    }

    private void registrarMovimentacao(CaixaDiario caixa, BigDecimal valor, String tipo, String descricao) {
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        // Pode ser interessante setar o CaixaDiario na movimentacao se a entidade permitir,
        // mas mantive exatamente a sua estrutura original.
        mov.setDescricao(descricao);
        mov.setValor(valor);
        mov.setTipo(tipo);
        mov.setCategoria("OPERACAO_CAIXA");
        movimentacaoRepository.save(mov);
    }
}
