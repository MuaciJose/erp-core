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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Se tem alguém logado, pegamos o ID da empresa do crachá dele
        if (authentication != null && authentication.getPrincipal() instanceof Usuario) {
            Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
            if (usuarioLogado.getEmpresaId() != null) {
                return usuarioLogado.getEmpresaId();
            }
        }

        // Se for uma rota pública (como a tela de login) ou sistema Local (Monousuário)
        // Definimos a Empresa 1 como padrão para não quebrar o sistema
        return 1L;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true; // Garante que a empresa não mude no meio de uma transação do banco
    }
}