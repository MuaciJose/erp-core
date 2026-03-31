package com.grandport.erp.modules.configuracoes.repository;

import com.grandport.erp.modules.configuracoes.model.LayoutTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LayoutTemplateVersionRepository extends JpaRepository<LayoutTemplateVersion, Long> {

    List<LayoutTemplateVersion> findByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(Long empresaId, String tipoLayout);

    Optional<LayoutTemplateVersion> findFirstByEmpresaIdAndTipoLayoutAndStatusOrderByVersionNumberDesc(
            Long empresaId,
            String tipoLayout,
            LayoutTemplateVersion.Status status
    );

    Optional<LayoutTemplateVersion> findFirstByEmpresaIdAndTipoLayoutOrderByVersionNumberDesc(Long empresaId, String tipoLayout);

    Optional<LayoutTemplateVersion> findByEmpresaIdAndId(Long empresaId, Long id);
}
