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
    // 🔐 CRÍTICO: Sem valor padrão! Força que empresaId seja explicitamente atribuído
    @Column(name = "empresa_id", nullable = false, columnDefinition = "bigint")
    private Long empresaId;

}