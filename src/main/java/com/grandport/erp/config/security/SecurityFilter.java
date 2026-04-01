package com.grandport.erp.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.assinatura.service.TenantAccessBlockedException;
import com.grandport.erp.modules.assinatura.service.TenantAccessService;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final AuthCookieService authCookieService;
    private final UsuarioRepository usuarioRepository;
    private final TenantAccessService tenantAccessService;
    private final PlanoPermissaoService planoPermissaoService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        var token = this.recoverToken(request);

        if (token != null) {
            try {
                var login = tokenService.validateToken(token);

                if (login != null && !login.isEmpty()) {
                    UserDetails user = usuarioRepository.findByUsername(login);

                    if (user instanceof com.grandport.erp.modules.usuario.model.Usuario) {
                        com.grandport.erp.modules.usuario.model.Usuario u = 
                            (com.grandport.erp.modules.usuario.model.Usuario) user;
                        log.debug("JWT validado para usuario={} empresaId={}", u.getUsername(), u.getEmpresaId());
                    }

                    if (user != null) {
                        if (user instanceof com.grandport.erp.modules.usuario.model.Usuario u) {
                            tenantAccessService.validarAcesso(u);
                        }
                        var authentication = new UsernamePasswordAuthenticationToken(user, null,
                                user instanceof com.grandport.erp.modules.usuario.model.Usuario u
                                        ? planoPermissaoService.getAuthorities(u)
                                        : user.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } else {
                        SecurityContextHolder.clearContext();
                        log.warn("JWT válido para usuário inexistente no banco: {}", login);
                    }
                }
            } catch (TenantAccessBlockedException blocked) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpStatus.LOCKED.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(new ObjectMapper().writeValueAsString(Map.of("error", blocked.getMessage())));
                return;
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                log.warn("Falha ao processar JWT: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.isBlank() && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return authCookieService.resolveToken(request);
    }
}
