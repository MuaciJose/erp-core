package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.financeiro.model.ContaPagar;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ContaPagarDTO {
    private Long id;
    private String descricao;
    private String fornecedorNome;
    private LocalDateTime dataVencimento;
    private BigDecimal valor;
    private String status;
    private boolean atrasado;

    public ContaPagarDTO(ContaPagar conta) {
        this.id = conta.getId();
        this.descricao = conta.getDescricao();
        this.fornecedorNome = conta.getParceiro() != null ? conta.getParceiro().getNome() : "N/A";
        this.dataVencimento = conta.getDataVencimento();
        this.valor = conta.getValorOriginal();
        this.status = conta.getStatus().toString();
        this.atrasado = conta.getDataVencimento().isBefore(LocalDateTime.now()) && "PENDENTE".equals(this.status);
    }
}
