package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ContaReceberRepository extends JpaRepository<ContaReceber, Long> {
    List<ContaReceber> findByStatus(StatusFinanceiro status);
    List<ContaReceber> findByParceiroIdAndStatus(Long parceiroId, StatusFinanceiro status);

    @Query("SELECT SUM(c.valorOriginal) FROM ContaReceber c WHERE c.status = 'PENDENTE' AND c.dataVencimento < CURRENT_DATE")
    Optional<BigDecimal> sumContasAtrasadas();
}
