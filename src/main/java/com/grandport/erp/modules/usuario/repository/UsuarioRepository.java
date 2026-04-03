package com.grandport.erp.modules.usuario.repository;

import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // 🔐 Mantido: Usado para o Login do sistema
    Usuario findByUsername(String username);

    // 🚀 NOVO: O Radar que busca a lista de soldados de uma base específica
    List<Usuario> findByEmpresaId(Long empresaId);

    // 🚀 NOVO: O Sniper que busca um soldado específico, MAS garante que ele é da base certa
    Optional<Usuario> findByIdAndEmpresaId(Long id, Long empresaId);

    Optional<Usuario> findFirstByEmpresaIdAndTipoAcessoOrderByIdAsc(Long empresaId, TipoAcesso tipoAcesso);

    boolean existsByEmpresaIdAndTipoAcesso(Long empresaId, TipoAcesso tipoAcesso);
}
