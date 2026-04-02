package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {

    Page<LogAuditoria> findAllByOrderByDataHoraDesc(Pageable pageable);

    @Query(
            value = """
                    select *
                    from logs_auditoria la
                    where (cast(:empresaId as bigint) is null or la.empresa_id = cast(:empresaId as bigint))
                      and (cast(:modulo as text) is null or upper(la.modulo) = upper(cast(:modulo as text)))
                      and (cast(:acao as text) is null or upper(coalesce(la.acao, '')) like concat('%', upper(cast(:acao as text)), '%'))
                      and (
                            cast(:busca as text) is null
                            or upper(coalesce(la.usuario_nome, '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(cast(la.detalhes as text), '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(la.ip_origem, '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(la.acao, '')) like concat('%', upper(cast(:busca as text)), '%')
                          )
                      and (cast(:dataInicio as timestamp) is null or la.data_hora >= cast(:dataInicio as timestamp))
                      and (cast(:dataFim as timestamp) is null or la.data_hora < cast(:dataFim as timestamp))
                    order by la.data_hora desc
                    """,
            countQuery = """
                    select count(*)
                    from logs_auditoria la
                    where (cast(:empresaId as bigint) is null or la.empresa_id = cast(:empresaId as bigint))
                      and (cast(:modulo as text) is null or upper(la.modulo) = upper(cast(:modulo as text)))
                      and (cast(:acao as text) is null or upper(coalesce(la.acao, '')) like concat('%', upper(cast(:acao as text)), '%'))
                      and (
                            cast(:busca as text) is null
                            or upper(coalesce(la.usuario_nome, '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(cast(la.detalhes as text), '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(la.ip_origem, '')) like concat('%', upper(cast(:busca as text)), '%')
                            or upper(coalesce(la.acao, '')) like concat('%', upper(cast(:busca as text)), '%')
                          )
                      and (cast(:dataInicio as timestamp) is null or la.data_hora >= cast(:dataInicio as timestamp))
                      and (cast(:dataFim as timestamp) is null or la.data_hora < cast(:dataFim as timestamp))
                    """,
            nativeQuery = true
    )
    Page<LogAuditoria> buscarFiltrado(
            @Param("empresaId") Long empresaId,
            @Param("modulo") String modulo,
            @Param("acao") String acao,
            @Param("busca") String busca,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable
    );

    List<LogAuditoria> findTop20ByEmpresaIdOrderByDataHoraDesc(Long empresaId);
}
