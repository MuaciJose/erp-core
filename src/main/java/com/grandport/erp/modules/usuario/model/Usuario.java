package com.grandport.erp.modules.usuario.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String senha;

    private String nomeCompleto;

    private boolean ativo = true;

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
        return permissoes.stream()
                .map(p -> new SimpleGrantedAuthority("ROLE_" + p.toUpperCase()))
                .collect(Collectors.toList());
    }
    @Override public String getPassword() { return senha; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return ativo; }
}
