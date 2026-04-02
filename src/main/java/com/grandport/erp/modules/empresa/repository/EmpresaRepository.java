package com.grandport.erp.modules.empresa.repository;

import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
    boolean existsByCnpj(String cnpj);

    long countByStatusAssinatura(StatusAssinatura statusAssinatura);

    long countByStatusAssinaturaAndAtivoTrue(StatusAssinatura statusAssinatura);

    long countByAtivoTrue();

    java.util.List<Empresa> findTop200ByOrderByDataCadastroDesc();
}
