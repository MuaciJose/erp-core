package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.ContaPagar;
import com.grandport.erp.modules.financeiro.model.StatusFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContaPagarRepository extends JpaRepository<ContaPagar, Long> {
    List<ContaPagar> findByStatus(StatusFinanceiro status);
}
