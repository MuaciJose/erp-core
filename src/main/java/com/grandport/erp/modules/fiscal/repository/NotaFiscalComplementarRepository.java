package com.grandport.erp.modules.fiscal.repository;

import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import com.grandport.erp.modules.fiscal.model.NotaFiscalComplementar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 📚 REPOSITÓRIO: Nota Fiscal Complementar
 * 
 * Interface para acesso aos dados de complementações fiscais
 */
@Repository
public interface NotaFiscalComplementarRepository extends JpaRepository<NotaFiscalComplementar, Long> {

    /**
     * Localiza todas as complementações de uma nota original
     */
    List<NotaFiscalComplementar> findByNotaOriginal(NotaFiscal notaOriginal);

    /**
     * Localiza complementação por chave de acesso
     */
    Optional<NotaFiscalComplementar> findByChaveAcesso(String chaveAcesso);

    /**
     * Conta complementações por status
     */
    long countByStatus(String status);

    /**
     * Localiza complementações autorizadas de uma nota
     */
    List<NotaFiscalComplementar> findByNotaOriginalAndStatus(NotaFiscal notaOriginal, String status);
}

