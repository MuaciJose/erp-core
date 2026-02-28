package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ContaReceberDTO {
    private Long id;
    private String parceiroNome;
    private LocalDateTime dataVencimento;
    private BigDecimal valor;
    private String status;
    private boolean atrasado;

    public ContaReceberDTO(ContaReceber conta) {
        this.id = conta.getId();
        this.parceiroNome = conta.getParceiro() != null ? conta.getParceiro().getNome() : "Consumidor";
        this.dataVencimento = conta.getDataVencimento();
        this.valor = conta.getValorOriginal();
        this.status = conta.getStatus().toString();
        this.atrasado = conta.getDataVencimento().isBefore(LocalDateTime.now()) && "PENDENTE".equals(this.status);
    }
}
