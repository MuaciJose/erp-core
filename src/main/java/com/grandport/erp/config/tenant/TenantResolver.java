package com.grandport.erp.config.tenant;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class TenantResolver implements CurrentTenantIdentifierResolver<Long> {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    @Override
    public Long resolveCurrentTenantIdentifier() {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();

            // Verifica se o Spring Security guardou o usuário completo na sessão
            if (principal instanceof Usuario) {
                Usuario usuario = (Usuario) principal;
                Long empresaId = usuario.getEmpresaId();
                
                if (empresaId == null || empresaId <= 0) {
                    System.out.println("[" + timestamp + "] 🟡 AVISO - TenantResolver: empresaId é NULL/INVÁLIDO para usuário [" + usuario.getUsername() + "]. Usando fallback 1L");
                    return 1L;
                }
                
                System.out.println("[" + timestamp + "] ✅ TenantResolver: Usuário [" + usuario.getUsername() + "] | Empresa ID: [" + empresaId + "]");
                return empresaId;
            } else {
                // Se cair aqui, é porque o Spring Security guardou só o Nome/String em vez do objeto Usuario!
                System.out.println("[" + timestamp + "] 🔴 ERRO - TenantResolver: Principal inválido! Tipo: " + principal.getClass().getName() + ". Valor: " + principal);
            }
        } else {
            System.out.println("[" + timestamp + "] 🔴 ERRO - TenantResolver: Nenhuma autenticação encontrada no SecurityContext!");
        }

        System.out.println("[" + timestamp + "] ⚠️ FALLBACK: Usando empresaId padrão (1L)");
        return 1L; // Fallback de emergência
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // 🚀 ISTO DEVE SER FALSE EM APIS REST!
        // Se for true, o Hibernate "decora" a Empresa 1 no momento que o servidor liga e nunca mais muda.
        return false;
    }
}