package com.grandport.erp.modules.usuario.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🚀 A MESMA MÁGICA PARA OS USUÁRIOS
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;  // SEM valor padrão - força carregar do banco

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String senha;

    private String nomeCompleto;

    private boolean ativo = true;

    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "force_password_change", nullable = false)
    private boolean forcePasswordChange = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_acesso", nullable = false)
    private TipoAcesso tipoAcesso = TipoAcesso.TENANT_USER;

    @Column(name = "is_mecanico")
    private Boolean isMecanico = false;

    @Column(name = "comissao_servico", precision = 5, scale = 2)
    private BigDecimal comissaoServico = BigDecimal.ZERO; // Ex: 40.00 para 40%

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_permissoes", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "permissao")
    private List<String> permissoes = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (permissoes == null) return new ArrayList<>();

        Set<String> authorities = new LinkedHashSet<>();

        for (String permissao : permissoes) {
            if (permissao == null || permissao.isBlank()) continue;
            String normalizada = permissao.trim().toUpperCase(Locale.ROOT);
            authorities.add("ROLE_" + normalizada);

            switch (normalizada) {
                case "USUARIOS" -> authorities.add("ROLE_ADMIN");
                case "CONFIGURACOES" -> authorities.add("ROLE_CONFIGURADOR");
                case "AUDITORIA" -> authorities.add("ROLE_AUDITORIA");
                case "CONTAS-PAGAR", "CONTAS-RECEBER", "BANCOS", "CONCILIACAO", "PLANO-CONTAS", "DRE" ->
                        authorities.add("ROLE_FINANCEIRO");
                case "VENDAS", "ORCAMENTOS", "CRM", "REVISOES" -> authorities.add("ROLE_VENDEDOR");
                case "CAIXA", "FILA-CAIXA", "PDV" -> authorities.add("ROLE_CAIXA");
                default -> {
                }
            }
        }

        if (tipoAcesso != null) {
            authorities.add("ROLE_" + tipoAcesso.name());
        }

        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
    @Override public String getPassword() { return senha; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return ativo; }
}
