package com.grandport.erp.modules.configuracoes.repository;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfiguracaoRepository extends JpaRepository<ConfiguracaoSistema, Long> {
    
    // 🔐 Query que respeita o contexto de tenant
    Optional<ConfiguracaoSistema> findFirstByEmpresaId(Long empresaId);
    
    // 🔐 Query para obter última configuração da empresa (seguro)
    Optional<ConfiguracaoSistema> findFirstByEmpresaIdOrderByIdDesc(Long empresaId);
}