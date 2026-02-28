package com.grandport.erp.modules.financeiro.dto;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ExtratoParceiroDTO {
    private Long clienteId;
    private String clienteNome;
    private String documento;
    private String telefone;
    private BigDecimal totalDevido;
    private List<ContaReceberDTO> itens;

    public ExtratoParceiroDTO(Parceiro parceiro, List<ContaReceberDTO> contas) {
        this.clienteId = parceiro.getId();
        this.clienteNome = parceiro.getNome();
        this.documento = parceiro.getDocumento();
        this.telefone = parceiro.getTelefone();
        this.itens = contas;
        this.totalDevido = contas.stream()
                                 .map(ContaReceberDTO::getValor)
                                 .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
