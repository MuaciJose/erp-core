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
    List<ContaPagar> findByStatus(StatusFinanceiro status);

    @Query("SELECT SUM(c.valorPago) FROM ContaPagar c WHERE c.status = 'PAGO' AND c.dataPagamento BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumDespesasPagasPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    // Se não tiver plano de contas, usa a descrição da conta como categoria
    @Query("SELECT new com.grandport.erp.modules.financeiro.dto.DespesaPorPlanoContaDTO(COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada'), SUM(cp.valorPago)) " +
           "FROM ContaPagar cp LEFT JOIN cp.planoConta pc " +
           "WHERE cp.status = 'PAGO' AND cp.dataPagamento BETWEEN :inicio AND :fim " +
           "GROUP BY COALESCE(pc.descricao, cp.descricao, 'Despesa Não Identificada')")
    List<DespesaPorPlanoContaDTO> sumDespesasPagasAgrupadasPorPlanoConta(
            @Param("inicio") LocalDateTime inicio, 
            @Param("fim") LocalDateTime fim);

    // Busca todas as contas a pagar de uma empresa num intervalo de datas
    List<ContaPagar> findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(
            Long empresaId,
            java.time.LocalDateTime inicio,
            java.time.LocalDateTime fim
    );
}
