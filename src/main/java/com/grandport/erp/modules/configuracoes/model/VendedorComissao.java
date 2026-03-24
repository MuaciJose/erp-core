package com.grandport.erp.modules.configuracoes.model;

import com.grandport.erp.modules.multiEmpresa.BaseEntityMultiEmpresa;
import jakarta.persistence.Embeddable;
import lombok.Data;
import java.math.BigDecimal;
import lombok.EqualsAndHashCode;

@Embeddable
@Data

public class VendedorComissao{
    private Long usuarioId;
    private BigDecimal comissao;
}