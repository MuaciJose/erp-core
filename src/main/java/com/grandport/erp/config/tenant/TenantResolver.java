package com.grandport.erp.config.tenant;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    @Override
    public Long resolveCurrentTenantIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();

            // Verifica se o Spring Security guardou o usuário completo na sessão
            if (principal instanceof Usuario) {
                Usuario usuario = (Usuario) principal;
                System.out.println("🟢 RADAR SAAS: Liberando dados da Empresa [" + usuario.getEmpresaId() + "] para o usuário: " + usuario.getUsername());

                return usuario.getEmpresaId() != null ? usuario.getEmpresaId() : 1L;
            } else {
                // Se cair aqui, é porque o seu filtro de segurança está guardando só o Nome/String em vez do objeto Usuario!
                System.out.println("🔴 ALERTA SAAS: O crachá está incompleto! Formato encontrado: " + principal.getClass().getName());
            }
        }

        return 1L; // Fallback de emergência
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // 🚀 ISTO DEVE SER FALSE EM APIS REST!
        // Se for true, o Hibernate "decora" a Empresa 1 no momento que o servidor liga e nunca mais muda.
        return false;
    }
}