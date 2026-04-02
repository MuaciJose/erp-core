package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.model.Revisao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    // Traz todas as revisões que não estão concluídas nem canceladas
    List<Revisao> findByStatusNotInOrderByDataPrevistaAsc(List<String> status);

    // 🚀 CONTA AS REVISÕES ATRASADAS
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.status = 'PENDENTE' AND r.dataPrevista < CURRENT_DATE")
    long countRevisoesAtrasadas();

    // 🚀 CONTA AS REVISÕES DE HOJE
    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.status = 'PENDENTE' AND r.dataPrevista = CURRENT_DATE")
    long countRevisoesParaHoje();

    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.empresaId = :empresaId AND r.status = 'PENDENTE' AND r.dataPrevista < CURRENT_DATE")
    long countRevisoesAtrasadasByEmpresa(@Param("empresaId") Long empresaId);

    @Query("SELECT COUNT(r) FROM Revisao r WHERE r.empresaId = :empresaId AND r.status = 'PENDENTE' AND r.dataPrevista = CURRENT_DATE")
    long countRevisoesParaHojeByEmpresa(@Param("empresaId") Long empresaId);

    java.util.Optional<Revisao> findByEmpresaIdAndId(Long empresaId, Long id);

    List<Revisao> findByEmpresaIdAndStatusNotInAndDataPrevistaLessThanEqualOrderByDataPrevistaAsc(
            Long empresaId,
            List<String> status,
            LocalDate dataPrevista
    );
}
