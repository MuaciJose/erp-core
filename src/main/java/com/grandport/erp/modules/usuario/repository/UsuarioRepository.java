package com.grandport.erp.modules.usuario.repository;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByUsername(String username);
}
