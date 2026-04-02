package com.grandport.erp.modules.admin.service;

import com.grandport.erp.modules.admin.dto.LogAuditoriaResumoDTO;
import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditoriaService {

    private final LogAuditoriaRepository repository;
    private final EmpresaContextService empresaContextService;
    private final EmpresaRepository empresaRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String modulo, String acao, String detalhes) {
        LogAuditoria registro = new LogAuditoria();
        registro.setDataHora(LocalDateTime.now());
        registro.setModulo(modulo);
        registro.setAcao(acao);
        registro.setDetalhes(detalhes);

        try {
            if (empresaContextService != null) {
                registro.setEmpresaId(empresaContextService.getRequiredEmpresaId());
            }
        } catch (Exception e) {
            log.debug("Auditoria sem empresa no contexto: {}", e.getMessage());
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
                registro.setIpOrigem(ip);
            } else {
                registro.setIpOrigem("SISTEMA_INTERNO");
            }
        } catch (Exception e) {
            registro.setIpOrigem("IP_DESCONHECIDO");
        }

        // 🛡️ Captura o usuário
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                if (auth.getPrincipal() instanceof Usuario) {
                    registro.setUsuarioNome(((Usuario) auth.getPrincipal()).getNomeCompleto());
                } else {
                    registro.setUsuarioNome(auth.getName()); // Salva o login (email) se não for o objeto Usuario
                }
            } else {
                registro.setUsuarioNome("SISTEMA");
            }
        } catch (Exception e) {
            registro.setUsuarioNome("SISTEMA_FALHA_AUTH");
        }

        repository.save(registro);
    }

    public Page<LogAuditoria> listarTodos(Pageable pageable) {
        return repository.findAllByOrderByDataHoraDesc(pageable);
    }

    public Page<LogAuditoriaResumoDTO> listarFiltrado(
            Long empresaId,
            String modulo,
            String acao,
            String busca,
            LocalDate dataInicio,
            LocalDate dataFim,
            Pageable pageable
    ) {
        LocalDateTime inicio = dataInicio == null ? null : dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim == null ? null : dataFim.plusDays(1).atStartOfDay();

        Page<LogAuditoria> pagina = repository.buscarFiltrado(
                empresaId,
                textoNormalizado(modulo),
                textoNormalizado(acao),
                textoNormalizado(busca),
                inicio,
                fim,
                pageable
        );

        Set<Long> empresaIds = pagina.getContent().stream()
                .map(LogAuditoria::getEmpresaId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, String> nomesEmpresa = empresaRepository.findAllById(empresaIds).stream()
                .collect(Collectors.toMap(item -> item.getId(), item -> item.getRazaoSocial(), (a, b) -> a));

        return pagina.map(logItem -> new LogAuditoriaResumoDTO(
                logItem.getId(),
                logItem.getDataHora(),
                logItem.getUsuarioNome(),
                logItem.getModulo(),
                logItem.getAcao(),
                logItem.getDetalhes(),
                logItem.getIpOrigem(),
                logItem.getEmpresaId(),
                logItem.getEmpresaId() == null ? "PLATAFORMA" : nomesEmpresa.getOrDefault(logItem.getEmpresaId(), "EMPRESA #" + logItem.getEmpresaId())
        ));
    }

    private String textoNormalizado(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
