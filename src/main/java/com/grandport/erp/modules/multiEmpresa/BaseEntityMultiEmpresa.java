package com.grandport.erp.modules.multiEmpresa;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.TenantId;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntityMultiEmpresa {

    @TenantId
    // 🚀 A MÁGICA AQUI: Diz pro banco colocar "1" em tudo que já existe!
    @Column(name = "empresa_id", nullable = false, columnDefinition = "bigint default 1")
    private Long empresaId = 1L;

}