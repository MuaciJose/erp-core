package com.grandport.erp.modules.fiscal.repository;

import com.grandport.erp.modules.fiscal.model.RegraFiscal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegraFiscalRepository extends JpaRepository<RegraFiscal, Long> {

    // Método inteligente que o sistema vai usar na hora de emitir a NFe
    Optional<RegraFiscal> findFirstByEstadoDestinoAndNcmPrefixoStartingWith(String estado, String ncm);
}