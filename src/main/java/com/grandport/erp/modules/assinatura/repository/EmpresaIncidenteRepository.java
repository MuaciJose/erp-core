package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.EmpresaIncidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface EmpresaIncidenteRepository extends JpaRepository<EmpresaIncidente, Long> {

    List<EmpresaIncidente> findByEmpresaIdOrderByUpdatedAtDesc(Long empresaId);

    List<EmpresaIncidente> findByIdIn(Collection<Long> ids);

    @Query("""
            select count(ei)
            from EmpresaIncidente ei
            where upper(ei.status) not in ('RESOLVIDO', 'ENCERRADO', 'CANCELADO')
            """)
    long countAbertos();

    @Query("""
            select count(ei)
            from EmpresaIncidente ei
            where upper(ei.status) not in ('RESOLVIDO', 'ENCERRADO', 'CANCELADO')
              and ei.prazoResolucao is not null
              and ei.prazoResolucao < :hoje
            """)
    long countSlaVencido(LocalDate hoje);
}
