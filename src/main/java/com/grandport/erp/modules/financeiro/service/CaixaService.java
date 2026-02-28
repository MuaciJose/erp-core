package com.grandport.erp.modules.financeiro.service;

import com.grandport.erp.modules.financeiro.dto.CaixaDiarioDTO;
import com.grandport.erp.modules.financeiro.model.CaixaDiario;
import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import com.grandport.erp.modules.financeiro.model.StatusCaixa;
import com.grandport.erp.modules.financeiro.repository.CaixaDiarioRepository;
import com.grandport.erp.modules.financeiro.repository.MovimentacaoCaixaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CaixaService {

    @Autowired private CaixaDiarioRepository caixaRepository;
    @Autowired private MovimentacaoCaixaRepository movimentacaoRepository;

    public CaixaDiarioDTO getCaixaAtual() {
        return caixaRepository.findByStatus(StatusCaixa.ABERTO)
                .map(CaixaDiarioDTO::new)
                .orElse(new CaixaDiarioDTO()); // Retorna DTO de caixa fechado
    }

    @Transactional
    public CaixaDiario abrirCaixa(BigDecimal saldoInicial) {
        Optional<CaixaDiario> caixaAberto = caixaRepository.findByStatus(StatusCaixa.ABERTO);
        if (caixaAberto.isPresent()) {
            throw new RuntimeException("Já existe um caixa aberto.");
        }

        CaixaDiario novoCaixa = new CaixaDiario();
        novoCaixa.setDataAbertura(LocalDateTime.now());
        novoCaixa.setSaldoInicial(saldoInicial);
        novoCaixa.setStatus(StatusCaixa.ABERTO);
        
        // Registra a entrada do troco inicial
        registrarMovimentacao(novoCaixa, saldoInicial, "ENTRADA", "Fundo de Caixa (Abertura)");

        return caixaRepository.save(novoCaixa);
    }

    @Transactional
    public CaixaDiario fecharCaixa(BigDecimal valorInformado) {
        CaixaDiario caixa = getCaixaAberto();
        caixa.setDataFechamento(LocalDateTime.now());
        caixa.setStatus(StatusCaixa.FECHADO);
        caixa.setValorInformadoFechamento(valorInformado);
        return caixaRepository.save(caixa);
    }

    @Transactional
    public void registrarSangria(BigDecimal valor, String motivo) {
        CaixaDiario caixa = getCaixaAberto();
        caixa.setTotalSangrias(caixa.getTotalSangrias().add(valor));
        
        registrarMovimentacao(caixa, valor.negate(), "SAIDA", motivo);

        caixaRepository.save(caixa);
    }
    
    @Transactional
    public void adicionarVendaAoCaixa(String metodoPagamento, BigDecimal valor) {
        CaixaDiario caixa = getCaixaAberto();
        switch (metodoPagamento) {
            case "DINHEIRO":
                caixa.setTotalDinheiro(caixa.getTotalDinheiro().add(valor));
                break;
            case "CARTAO":
                caixa.setTotalCartao(caixa.getTotalCartao().add(valor));
                break;
            case "PIX":
                caixa.setTotalPix(caixa.getTotalPix().add(valor));
                break;
        }
        caixaRepository.save(caixa);
    }

    public CaixaDiario getCaixaAberto() {
        return caixaRepository.findByStatus(StatusCaixa.ABERTO)
                .orElseThrow(() -> new RuntimeException("Nenhum caixa aberto."));
    }

    private void registrarMovimentacao(CaixaDiario caixa, BigDecimal valor, String tipo, String descricao) {
        MovimentacaoCaixa mov = new MovimentacaoCaixa();
        mov.setDescricao(descricao);
        mov.setValor(valor);
        mov.setTipo(tipo);
        mov.setCategoria("OPERACAO_CAIXA");
        movimentacaoRepository.save(mov);
    }
}
