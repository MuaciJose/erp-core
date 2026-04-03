package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.PlanoSaasModulo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanoSaasModuloRepository extends JpaRepository<PlanoSaasModulo, Long> {
    List<PlanoSaasModulo> findByPlanoIdOrderByModuloAsc(Long planoId);
    void deleteByPlanoId(Long planoId);
}
