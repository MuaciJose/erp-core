package com.grandport.erp.config.tenant;

import com.grandport.erp.modules.usuario.model.Usuario;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Slf4j
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    @Override
    public Long resolveCurrentTenantIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            log.debug("TenantResolver sem autenticacao; usando tenant de sistema.");
            return 0L;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            Long empresaId = usuario.getEmpresaId();
            if (empresaId == null) {
                throw new IllegalStateException("Usuario autenticado sem empresa configurada.");
            }
            log.debug("TenantResolver usuario={} empresaId={}", usuario.getUsername(), empresaId);
            return empresaId;
        }

        log.debug("TenantResolver principal={} sem contexto de usuario; usando tenant de sistema.", auth.getPrincipal());
        return 0L;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false;
    }
}
