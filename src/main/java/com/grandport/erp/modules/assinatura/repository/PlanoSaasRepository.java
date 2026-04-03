package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.PlanoSaas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanoSaasRepository extends JpaRepository<PlanoSaas, Long> {
    Optional<PlanoSaas> findByCodigoIgnoreCase(String codigo);
    List<PlanoSaas> findAllByOrderByValorMensalBaseAscNomeExibicaoAsc();
}
