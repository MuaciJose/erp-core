package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.PlanoConta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlanoContaRepository extends JpaRepository<PlanoConta, Long> {
    // ✅ MULTI-EMPRESA: Métodos com filtro de empresa
    List<PlanoConta> findByEmpresaIdAndContaPaiIsNull(Long empresaId);
    List<PlanoConta> findByEmpresaIdAndTipoAndAceitaLancamentoTrue(Long empresaId, String tipo);
    List<PlanoConta> findByEmpresaId(Long empresaId);
    Optional<PlanoConta> findByEmpresaIdAndId(Long empresaId, Long id);
    
    // ❌ DEPRECATED: Métodos antigos sem filtro (para compatibilidade temporária)
    @Deprecated
    List<PlanoConta> findByContaPaiIsNull();
    
    @Deprecated
    List<PlanoConta> findByTipoAndAceitaLancamentoTrue(String tipo);
}
