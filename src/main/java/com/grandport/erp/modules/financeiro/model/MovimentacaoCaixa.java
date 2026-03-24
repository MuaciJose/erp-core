package com.grandport.erp.modules.financeiro.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class MovimentacaoCaixa  extends BaseEntityMultiEmpresa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDateTime dataMovimentacao = LocalDateTime.now();
    private String descricao;
    private BigDecimal valor;
    private String tipo; // "ENTRADA" ou "SAIDA"
    private String categoria; // "VENDA", "COMPRA_ESTOQUE", "ALUGUEL", etc.
}
