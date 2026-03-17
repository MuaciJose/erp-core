package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {

    // 🚀 AGORA É PAGE! Impede que o servidor trave com milhões de registros.
    Page<LogAuditoria> findAllByOrderByDataHoraDesc(Pageable pageable);
}