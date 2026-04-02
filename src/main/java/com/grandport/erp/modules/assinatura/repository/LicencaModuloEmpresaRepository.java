package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.LicencaModuloEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LicencaModuloEmpresaRepository extends JpaRepository<LicencaModuloEmpresa, Long> {

    List<LicencaModuloEmpresa> findByEmpresaIdOrderByModuloAsc(Long empresaId);

    Optional<LicencaModuloEmpresa> findByEmpresaIdAndModuloIgnoreCase(Long empresaId, String modulo);

    @Query("""
            select coalesce(sum(case when l.ativo = true then l.valorMensalExtra else 0 end), 0)
            from LicencaModuloEmpresa l
            """)
    java.math.BigDecimal somarExtrasAtivos();

    long countByAtivoTrueAndTrialAteGreaterThanEqual(LocalDate data);

    long countByAtivoTrueAndValorMensalExtraGreaterThan(java.math.BigDecimal valor);

    List<LicencaModuloEmpresa> findByAtivoTrueAndTrialAteBefore(LocalDate data);
}
