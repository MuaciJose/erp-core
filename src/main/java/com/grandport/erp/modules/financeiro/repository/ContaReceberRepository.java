package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.ContaReceber;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContaReceberRepository extends JpaRepository<ContaReceber, Long> {
    List<ContaReceber> findByStatus(StatusFinanceiro status);
}
