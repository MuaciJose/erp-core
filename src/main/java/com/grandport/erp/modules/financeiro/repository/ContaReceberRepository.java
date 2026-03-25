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

    // 🚀 O NOVO MÉTODO BLINDADO PARA O EDI BANCÁRIO
    List<ContaReceber> findByEmpresaIdAndStatus(Long empresaId, StatusFinanceiro status);

    List<ContaReceber> findByStatus(StatusFinanceiro status);

    List<ContaReceber> findByParceiroIdAndStatus(Long parceiroId, StatusFinanceiro status);

    // 🛡️ ALERTA TÁTICO: Atualizei esta query para respeitar a Empresa e não vazar dados!
    @Query("SELECT SUM(c.valorOriginal) FROM ContaReceber c WHERE c.empresaId = :empresaId AND c.status = 'PENDENTE' AND c.dataVencimento < CURRENT_DATE")
    Optional<BigDecimal> sumContasAtrasadasBlindado(@Param("empresaId") Long empresaId);

    // Busca todas as contas a receber de uma empresa num intervalo de datas
    List<ContaReceber> findByEmpresaIdAndDataVencimentoBetweenOrderByDataVencimentoAsc(
            Long empresaId,
            java.time.LocalDateTime inicio,
            java.time.LocalDateTime fim
    );
}