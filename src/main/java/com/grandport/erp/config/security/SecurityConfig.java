package com.grandport.erp.config.security;

import org.springframework.beans.factory.annotation.Autowired;
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
public class SecurityConfig {

    @Autowired
    private SecurityFilter securityFilter;

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
                        // 🚀  ESTA LINHA AQUI PARA LIBERAR O TESTE PDF:
                        .requestMatchers("/api/teste-pdf").permitAll()
                        // 🚀 A NOVA CHAVE MESTRA PARA A IMPRESSÃO DA OS:
                        .requestMatchers("/api/os/*/imprimir-pdf").permitAll()
                        .requestMatchers("/api/vendas/*/imprimir-pdf").permitAll()
                        .requestMatchers("/api/relatorios/comissoes/pdf").permitAll()
                        .requestMatchers("/api/caixa/pdf").permitAll()
                        .requestMatchers("/api/compras/*/pdf").permitAll()
                        .requestMatchers("/api/financeiro/dre/pdf").permitAll()
                        .requestMatchers("/api/financeiro/recibos/gerar-pdf").permitAll()
                        .requestMatchers("/api/financeiro/contas-a-pagar/*/recibo-pdf").permitAll()
                        .requestMatchers("/api/financeiro/contas-a-pagar/relatorio-pdf").permitAll()
                        .requestMatchers("/api/financeiro/contas-a-receber/*/recibo-pdf").permitAll()
                        .requestMatchers("/api/financeiro/contas-a-receber/relatorio-pdf").permitAll()





                        .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()


                        .requestMatchers("/api/parceiros/consulta-cnpj/**").permitAll()
                        .requestMatchers("/api/parceiros/consulta-cep/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/configuracoes/backup").permitAll()

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

        // 🚀 O SEGREDO AQUI: Liberando padrões de origem em vez de string exata
        // Isso impede que o Vite trave o PUT por causa de mudança de IP ou 127.0.0.1
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*:*"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

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