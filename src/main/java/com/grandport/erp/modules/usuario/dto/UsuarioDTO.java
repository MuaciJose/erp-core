package com.grandport.erp.modules.usuario.dto;

import com.grandport.erp.modules.usuario.model.Usuario;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String nome;
    private String email;
    private String senha;
    private String perfil;
    private boolean ativo;

    public UsuarioDTO(Usuario u) {
        this.id = u.getId();
        this.nome = u.getNomeCompleto();
        this.email = u.getUsername();
        this.perfil = u.getRole().name();
        this.ativo = u.isAtivo();
    }
}
