package com.grandport.erp.modules.configuracoes.repository;

import com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoRepository extends JpaRepository<ConfiguracaoSistema, Long> {
}