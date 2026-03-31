package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.SecurityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findByEmpresaIdOrderByDataHoraDesc(Long empresaId, Pageable pageable);
}
