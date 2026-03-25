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

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String modulo, String acao, String detalhes) {
        LogAuditoria log = new LogAuditoria();
        log.setDataHora(LocalDateTime.now());
        log.setModulo(modulo);
        log.setAcao(acao);
        log.setDetalhes(detalhes);

        // 🚀 NOVO: Preencher empresaId com a empresa do usuário autenticado
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Usuario) {
                Usuario usuario = (Usuario) auth.getPrincipal();
                Long empresaId = usuario.getEmpresaId();
                if (empresaId != null && empresaId > 0) {
                    log.setEmpresaId(empresaId);
                    System.out.println("🔐 AuditoriaService: Log criado para empresa [" + empresaId + "]");
                } else {
                    log.setEmpresaId(1L); // Fallback
                    System.out.println("⚠️ AuditoriaService: Usuario sem empresaId, usando 1L");
                }
            } else {
                log.setEmpresaId(1L); // Fallback para sistema interno
                System.out.println("⚠️ AuditoriaService: Autenticação não encontrada, usando empresa 1L");
            }
        } catch (Exception e) {
            log.setEmpresaId(1L);
            System.out.println("❌ AuditoriaService: Erro ao extrair empresaId: " + e.getMessage());
        }

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