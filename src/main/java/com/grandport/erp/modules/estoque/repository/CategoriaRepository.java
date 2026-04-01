package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    java.util.Optional<Categoria> findByEmpresaIdAndId(Long empresaId, Long id);
    List<Categoria> findByEmpresaIdOrderByNomeAsc(Long empresaId);
}
