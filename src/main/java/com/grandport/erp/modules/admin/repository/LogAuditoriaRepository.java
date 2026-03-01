package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
    List<LogAuditoria> findAllByOrderByDataHoraDesc();
}
