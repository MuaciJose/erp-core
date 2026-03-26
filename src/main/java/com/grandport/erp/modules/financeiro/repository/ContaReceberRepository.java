package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ContaReceberRepository extends JpaRepository<ContaReceber, Long> {

    // ✅ MULTI-EMPRESA: Métodos com filtro de empresa
    List<ContaReceber> findByEmpresaIdAndStatusOrderByDataVencimentoAsc(Long empresaId, StatusFinanceiro status);
    List<ContaReceber> findByEmpresaIdAndParceiroIdAndStatus(Long empresaId, Long parceiroId, StatusFinanceiro status);
    List<ContaReceber> findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(
            Long empresaId,
            java.time.LocalDateTime inicio,
            java.time.LocalDateTime fim
    );
    Optional<ContaReceber> findByEmpresaIdAndId(Long empresaId, Long id);

    // ✅ MULTI-EMPRESA: Query com filtro de empresa
    @Query("SELECT SUM(c.valorOriginal) FROM ContaReceber c WHERE c.empresaId = :empresaId AND c.status = 'PENDENTE' AND c.dataVencimento < CURRENT_DATE")
    Optional<BigDecimal> sumContasAtrasadas(@Param("empresaId") Long empresaId);

    @Query("SELECT SUM(c.valorOriginal) FROM ContaReceber c WHERE c.empresaId = :empresaId AND c.status = 'PENDENTE'")
    Optional<BigDecimal> sumContasAReceberPendentes(@Param("empresaId") Long empresaId);

    // ❌ DEPRECATED: Métodos antigos sem filtro
    @Deprecated
    List<ContaReceber> findByStatus(StatusFinanceiro status);

    @Deprecated
    List<ContaReceber> findByParceiroIdAndStatus(Long parceiroId, StatusFinanceiro status);
}