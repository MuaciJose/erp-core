package com.grandport.erp.modules.admin.service;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
public class AuditoriaService {

    @Autowired
    private LogAuditoriaRepository repository;

    // 🚀 @Async: Faz a gravação ocorrer em segundo plano. Não atrasa o sistema!
    // 🚀 REQUIRES_NEW: Se der erro na Venda e fizer Rollback, o Log continua sendo salvo (mostra a tentativa).
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String modulo, String acao, String detalhes) {
        LogAuditoria log = new LogAuditoria();
        log.setDataHora(LocalDateTime.now());
        log.setModulo(modulo);
        log.setAcao(acao);
        log.setDetalhes(detalhes);

        // 🛡️ Captura o IP limpando proxys
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else if (ip.contains(",")) {
                    // Pega apenas o primeiro IP caso venha uma lista de proxys
                    ip = ip.split(",")[0].trim();
                }
                if ("0:0:0:0:0:0:0:1".equals(ip)) ip = "127.0.0.1";
                log.setIpOrigem(ip);
            } else {
                log.setIpOrigem("SISTEMA_INTERNO");
            }
        } catch (Exception e) {
            log.setIpOrigem("IP_DESCONHECIDO");
        }

        // 🛡️ Captura o usuário
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                if (auth.getPrincipal() instanceof Usuario) {
                    log.setUsuarioNome(((Usuario) auth.getPrincipal()).getNomeCompleto());
                } else {
                    log.setUsuarioNome(auth.getName()); // Salva o login (email) se não for o objeto Usuario
                }
            } else {
                log.setUsuarioNome("SISTEMA");
            }
        } catch (Exception e) {
            log.setUsuarioNome("SISTEMA_FALHA_AUTH");
        }

        repository.save(log);
    }

    public Page<LogAuditoria> listarTodos(Pageable pageable) {
        return repository.findAllByOrderByDataHoraDesc(pageable);
    }
}