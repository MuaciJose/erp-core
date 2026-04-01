package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Marca;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarcaRepository extends JpaRepository<Marca, Long> {
    // Busca marcas por nome para filtros rápidos no Mobile/Web
    java.util.Optional<Marca> findByEmpresaIdAndId(Long empresaId, Long id);
    List<Marca> findByEmpresaIdOrderByNomeAsc(Long empresaId);
    List<Marca> findByEmpresaIdAndNomeContainingIgnoreCase(Long empresaId, String nome);
}
