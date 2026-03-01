package com.grandport.erp.modules.usuario.dto;

import com.grandport.erp.modules.usuario.model.Usuario;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String nome;
    private String email;
    private String senha;
    private boolean ativo;
    private List<String> permissoes;

    public UsuarioDTO(Usuario u) {
        this.id = u.getId();
        this.nome = u.getNomeCompleto();
        this.email = u.getUsername();
        this.ativo = u.isAtivo();
        this.permissoes = u.getPermissoes();
    }
}
