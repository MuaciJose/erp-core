package com.grandport.erp.modules.configuracoes.service;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class EmpresaContextService {

    public Long getRequiredEmpresaId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("Usuário não autenticado para resolver empresa.");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Usuario usuario)) {
            throw new IllegalStateException("Contexto de autenticação inválido para resolver empresa.");
        }

        Long empresaId = usuario.getEmpresaId();
        if (empresaId == null || empresaId <= 0) {
            throw new IllegalStateException("Usuário autenticado sem empresa válida.");
        }

        return empresaId;
    }
}
