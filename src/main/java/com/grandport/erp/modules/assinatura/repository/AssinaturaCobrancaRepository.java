package com.grandport.erp.modules.assinatura.repository;

import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.model.CobrancaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssinaturaCobrancaRepository extends JpaRepository<AssinaturaCobranca, Long> {
    List<AssinaturaCobranca> findTop20ByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(Long empresaId);
    Optional<AssinaturaCobranca> findTopByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(Long empresaId);
    Optional<AssinaturaCobranca> findByGatewayNomeAndGatewayCobrancaId(String gatewayNome, String gatewayCobrancaId);
    List<AssinaturaCobranca> findByStatus(CobrancaStatus status);
}
