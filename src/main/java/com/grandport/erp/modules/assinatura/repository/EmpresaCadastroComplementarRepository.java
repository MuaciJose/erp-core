package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.EmpresaCadastroComplementar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpresaCadastroComplementarRepository extends JpaRepository<EmpresaCadastroComplementar, Long> {

    Optional<EmpresaCadastroComplementar> findByEmpresaId(Long empresaId);
}
