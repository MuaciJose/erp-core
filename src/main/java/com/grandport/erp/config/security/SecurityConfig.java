package com.grandport.erp.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ================= ROTAS PÚBLICAS =================
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers("/error").permitAll()
                        // 🚀  ESTA LINHA AQUI PARA LIBERAR O TESTE PDF:
                        .requestMatchers("/api/teste-pdf").permitAll()
                        // 🚀 A NOVA CHAVE MESTRA PARA A IMPRESSÃO DA OS:
                        .requestMatchers("/api/os/*/imprimir-pdf").permitAll()
                        .requestMatchers("/api/vendas/*/imprimir-pdf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/assinaturas/nova-empresa").permitAll()





                        .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()


                        .requestMatchers("/api/parceiros/consulta-cnpj/**").permitAll()
                        .requestMatchers("/api/parceiros/consulta-cep/**").permitAll()
                        // ================= ROTAS PRIVADAS (Requerem Token) =================
                        // 🚀 COMPRAS: Voltei para autenticado. Se o GET/POST funciona, o PUT tem que funcionar.
                        .requestMatchers("/api/compras/**").authenticated()

                        .requestMatchers("/api/whatsapp/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/vendas/*/whatsapp").authenticated()

                        // Rota do módulo fiscal liberada para usuários logados
                        .requestMatchers("/api/ncm/**").authenticated()
                        .requestMatchers("/api/fiscal/**").authenticated()

                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/auth/logout").authenticated()

                        .requestMatchers("/api/veiculos/**").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ SEGURANÇA: Definir domínios específicos (não wildcard)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",              // Dev frontend React
            "http://localhost:5173",              // Dev Vite
            "http://127.0.0.1:3000",              // Dev local
            "http://127.0.0.1:5173",              // Dev local Vite
            "https://www.seudominio.com",         // Produção
            "https://app.seudominio.com",         // Produção app
            "https://admin.seudominio.com"        // Admin produção
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Total-Count"));
        configuration.setAllowCredentials(false); // true apenas se necessário em produção
        configuration.setMaxAge(3600L); // Cache preflight por 1 hora

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
