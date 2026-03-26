package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.ContaBancaria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ContaBancariaRepository extends JpaRepository<ContaBancaria, Long> {
    // ✅ MULTI-EMPRESA: Métodos com filtro de empresa
    List<ContaBancaria> findByEmpresaId(Long empresaId);
    Optional<ContaBancaria> findByEmpresaIdAndId(Long empresaId, Long id);
}
