package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.dto.DespesaPorPlanoContaDTO;
import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ContaPagarRepository extends JpaRepository<ContaPagar, Long> {
    
    // ✅ MULTI-EMPRESA: Métodos com filtro de empresa
    List<ContaPagar> findByEmpresaIdOrderByDataVencimentoAsc(Long empresaId);
    List<ContaPagar> findByEmpresaIdOrderByDataVencimentoDesc(Long empresaId);
    List<ContaPagar> findByEmpresaIdAndParceiroIdOrderByDataVencimentoAsc(Long empresaId, Long parceiroId);
    List<ContaPagar> findByEmpresaIdAndStatus(Long empresaId, StatusFinanceiro status);
    List<ContaPagar> findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(Long empresaId, LocalDateTime inicio, LocalDateTime fim);
    List<ContaPagar> findByEmpresaIdAndDataPagamentoBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);
    Optional<ContaPagar> findByEmpresaIdAndId(Long empresaId, Long id);

    @Query("SELECT SUM(c.valorPago) FROM ContaPagar c WHERE c.empresaId = :empresaId AND c.status = 'PAGO' AND c.dataPagamento BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumDespesasPagasPeriodo(@Param("empresaId") Long empresaId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT new com.grandport.erp.modules.financeiro.dto.DespesaPorPlanoContaDTO(COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada'), SUM(cp.valorPago)) " +
           "FROM ContaPagar cp LEFT JOIN cp.planoConta pc " +
           "WHERE cp.empresaId = :empresaId AND cp.status = 'PAGO' AND cp.dataPagamento BETWEEN :inicio AND :fim " +
           "GROUP BY COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada')")
    List<DespesaPorPlanoContaDTO> sumDespesasPagasAgrupadasPorPlanoConta(
            @Param("empresaId") Long empresaId,
            @Param("inicio") LocalDateTime inicio, 
            @Param("fim") LocalDateTime fim);

    // ❌ DEPRECATED: Métodos antigos sem filtro
    @Deprecated
    List<ContaPagar> findByStatus(StatusFinanceiro status);

    @Deprecated
    @Query("SELECT SUM(c.valorPago) FROM ContaPagar c WHERE c.status = 'PAGO' AND c.dataPagamento BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumDespesasPagasPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Deprecated
    @Query("SELECT new com.grandport.erp.modules.financeiro.dto.DespesaPorPlanoContaDTO(COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada'), SUM(cp.valorPago)) " +
           "FROM ContaPagar cp LEFT JOIN cp.planoConta pc " +
           "WHERE cp.status = 'PAGO' AND cp.dataPagamento BETWEEN :inicio AND :fim " +
           "GROUP BY COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada')")
    List<DespesaPorPlanoContaDTO> sumDespesasPagasAgrupadasPorPlanoConta(
            @Param("inicio") LocalDateTime inicio, 
            @Param("fim") LocalDateTime fim);
}
