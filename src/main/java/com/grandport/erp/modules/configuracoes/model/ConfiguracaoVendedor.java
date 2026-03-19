package com.grandport.erp.modules.configuracoes.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.math.BigDecimal;

@Embeddable
@Data
public class ConfiguracaoVendedor {
    private Long usuarioId;
    private BigDecimal comissao;
}