package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO de resposta para ContaBancaria
 * Nunca retorna dados sensíveis ou internos
 */
@Data
@Builder
public class ContaBancariaResponseDTO {
    private Long id;
    private String nome;
    private String tipo;
    private String numeroBanco;
    private String agencia;
    private String numeroConta;
    private String digitoConta;
    private BigDecimal saldoAtual;

    public static ContaBancariaResponseDTO fromEntity(ContaBancaria conta) {
        return ContaBancariaResponseDTO.builder()
                .id(conta.getId())
                .nome(conta.getNome())
                .tipo(conta.getTipo())
                .numeroBanco(conta.getNumeroBanco())
                .agencia(conta.getAgencia())
                .numeroConta(conta.getNumeroConta())
                .digitoConta(conta.getDigitoConta())
                .saldoAtual(conta.getSaldoAtual())
                .build();
    }
}


