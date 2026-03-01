package com.grandport.erp.modules.admin.service;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditoriaService {

    @Autowired
    private LogAuditoriaRepository repository;

    public void registrar(String modulo, String acao, String detalhes) {
        LogAuditoria log = new LogAuditoria();
        log.setDataHora(LocalDateTime.now());
        log.setModulo(modulo);
        log.setAcao(acao);
        log.setDetalhes(detalhes);

        // Captura o IP da requisição
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
            
            // Traduz o loopback IPv6 para IPv4 para melhor legibilidade
            if ("0:0:0:0:0:0:0:1".equals(ip)) {
                ip = "127.0.0.1";
            }

            log.setIpOrigem(ip);
        } catch (Exception e) {
            log.setIpOrigem("0.0.0.0");
        }

        // Captura o usuário logado
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof Usuario) {
                log.setUsuarioNome(((Usuario) principal).getNomeCompleto());
            } else {
                log.setUsuarioNome("SISTEMA");
            }
        } catch (Exception e) {
            log.setUsuarioNome("SISTEMA");
        }

        repository.save(log);
    }

    public List<LogAuditoria> listarTodos() {
        return repository.findAllByOrderByDataHoraDesc();
    }
}
