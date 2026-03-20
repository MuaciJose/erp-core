package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ContaReceberDTO {
    private Long id;
    private String parceiroNome;
    private String descricao;
    private LocalDateTime dataVencimento;
    private LocalDateTime dataPagamento; // 🚀 NOVO: Necessário para o filtro de "Recebidos Hoje"
    private BigDecimal valor;
    private String status;
    private boolean atrasado;

    public ContaReceberDTO(ContaReceber conta) {
        this.id = conta.getId();
        this.parceiroNome = conta.getParceiro() != null ? conta.getParceiro().getNome() : "Consumidor";
        this.descricao = conta.getDescricao() != null ? conta.getDescricao() : "Venda a Prazo";
        this.dataVencimento = conta.getDataVencimento();
        this.dataPagamento = conta.getDataPagamento(); // 🚀 Mapeia a data de recebimento
        this.valor = conta.getValorOriginal();
        this.status = conta.getStatus() != null ? conta.getStatus().toString() : "PENDENTE";

        if (this.dataVencimento != null) {
            this.atrasado = this.dataVencimento.isBefore(LocalDateTime.now()) && "PENDENTE".equals(this.status);
        } else {
            this.atrasado = false;
        }
    }
}