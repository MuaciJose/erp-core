package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.AssinaturaInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssinaturaInviteRepository extends JpaRepository<AssinaturaInvite, Long> {
    Optional<AssinaturaInvite> findByToken(String token);
    List<AssinaturaInvite> findTop50ByOrderByCreatedAtDesc();
}
