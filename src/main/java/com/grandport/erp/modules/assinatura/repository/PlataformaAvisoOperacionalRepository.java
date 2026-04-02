package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.PlataformaAvisoOperacional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlataformaAvisoOperacionalRepository extends JpaRepository<PlataformaAvisoOperacional, Long> {

    Optional<PlataformaAvisoOperacional> findFirstByTipoOrderByIdAsc(String tipo);
}
