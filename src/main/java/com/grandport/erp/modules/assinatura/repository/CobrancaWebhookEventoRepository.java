package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.CobrancaWebhookEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CobrancaWebhookEventoRepository extends JpaRepository<CobrancaWebhookEvento, Long> {
    Optional<CobrancaWebhookEvento> findByProviderAndExternalEventId(String provider, String externalEventId);
}
