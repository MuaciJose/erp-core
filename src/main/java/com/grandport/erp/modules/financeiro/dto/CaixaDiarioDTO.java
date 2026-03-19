package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.financeiro.model.CaixaDiario;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CaixaDiarioDTO {
    private String status;
    private BigDecimal saldoInicial;
    private BigDecimal dinheiro;
    private BigDecimal cartao;
    private BigDecimal pix;
    private BigDecimal sangrias;
    private BigDecimal valorInformadoFechamento;

    public CaixaDiarioDTO(CaixaDiario caixa) {
        this.status = caixa.getStatus().toString();
        this.saldoInicial = caixa.getSaldoInicial();
        this.dinheiro = caixa.getTotalDinheiro();
        this.cartao = caixa.getTotalCartao();
        this.pix = caixa.getTotalPix();
        this.sangrias = caixa.getTotalSangrias();
        this.valorInformadoFechamento = caixa.getValorInformadoFechamento();
    }
    
    // Construtor para quando o caixa está fechado
    public CaixaDiarioDTO() {
        this.status = "FECHADO";
        this.saldoInicial = BigDecimal.ZERO;
        this.dinheiro = BigDecimal.ZERO;
        this.cartao = BigDecimal.ZERO;
        this.pix = BigDecimal.ZERO;
        this.sangrias = BigDecimal.ZERO;
        this.valorInformadoFechamento = BigDecimal.ZERO;
    }
}
