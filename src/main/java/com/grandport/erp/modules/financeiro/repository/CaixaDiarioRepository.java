package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.CaixaDiario;
import com.grandport.erp.modules.financeiro.model.StatusCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CaixaDiarioRepository extends JpaRepository<CaixaDiario, Long> {
    
    // ✅ MULTI-EMPRESA: Métodos com filtro de empresa
    Optional<CaixaDiario> findTopByEmpresaIdOrderByIdDesc(Long empresaId);
    List<CaixaDiario> findByEmpresaIdOrderByDataAberturaDesc(Long empresaId);
    Optional<CaixaDiario> findByEmpresaIdAndStatus(Long empresaId, StatusCaixa status);
    Optional<CaixaDiario> findByEmpresaIdAndId(Long empresaId, Long id);
    
    // ❌ DEPRECATED: Métodos antigos sem filtro
    @Deprecated
    Optional<CaixaDiario> findByStatus(StatusCaixa status);

    @Deprecated
    Optional<CaixaDiario> findTopByOrderByIdDesc();
}