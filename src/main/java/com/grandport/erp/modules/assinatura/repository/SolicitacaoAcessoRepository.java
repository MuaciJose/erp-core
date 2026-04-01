package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.SolicitacaoAcesso;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitacaoAcessoRepository extends JpaRepository<SolicitacaoAcesso, Long> {
    boolean existsByCnpjAndStatusIn(String cnpj, java.util.Collection<String> status);

    java.util.List<SolicitacaoAcesso> findTop100ByOrderByCreatedAtDesc();
}
