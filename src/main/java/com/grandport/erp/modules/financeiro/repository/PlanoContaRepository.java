package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.PlanoConta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanoContaRepository extends JpaRepository<PlanoConta, Long> {
    List<PlanoConta> findByContaPaiIsNull();
    List<PlanoConta> findByTipoAndAceitaLancamentoTrue(String tipo);
}
