package com.grandport.erp.modules.admin.service;

import com.grandport.erp.modules.admin.model.SecurityEvent;
import com.grandport.erp.modules.admin.repository.SecurityEventRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityEventService {

    private final SecurityEventRepository repository;
    private final EmpresaContextService empresaContextService;

    @Transactional
    public void registrar(Long empresaId, String tipo, String severidade, String username, String ipOrigem, String detalhes) {
        SecurityEvent event = new SecurityEvent();
        event.setEmpresaId(empresaId);
        event.setDataHora(LocalDateTime.now());
        event.setTipo(tipo);
        event.setSeveridade(severidade);
        event.setUsername(username);
        event.setIpOrigem(ipOrigem);
        event.setDetalhes(detalhes);
        repository.save(event);
    }

    @Transactional(readOnly = true)
    public List<SecurityEvent> listarRecentes(int limit) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return repository.findByEmpresaIdOrderByDataHoraDesc(empresaId, PageRequest.of(0, safeLimit));
    }
}
