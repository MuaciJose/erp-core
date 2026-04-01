package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Ncm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface NcmRepository extends JpaRepository<Ncm, Long> {

    Optional<Ncm> findByCodigoAndEmpresaId(String codigo, Long empresaId);

    // Mantido para o seu Autocomplete antigo
    @Query(value = "SELECT * FROM ncms n " +
            "WHERE n.empresa_id = :empresaId " +
            "AND (REPLACE(n.codigo, '.', '') LIKE CONCAT('%', :termo, '%') " +
            "OR LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%')))",
            nativeQuery = true)
    List<Ncm> buscarPorTermo(@Param("termo") String termo, @Param("empresaId") Long empresaId);

    @Query(value = "SELECT * FROM ncms n " +
            "WHERE n.empresa_id = :empresaId " +
            "AND (:termo IS NULL OR :termo = '' " +
            "OR REPLACE(n.codigo, '.', '') LIKE CONCAT('%', :termo, '%') " +
            "OR LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%')))",
            countQuery = "SELECT COUNT(*) FROM ncms n " +
                    "WHERE n.empresa_id = :empresaId " +
                    "AND (:termo IS NULL OR :termo = '' " +
                    "OR REPLACE(n.codigo, '.', '') LIKE CONCAT('%', :termo, '%') " +
                    "OR LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%')))",
            nativeQuery = true)
    Page<Ncm> buscarPaginado(@Param("termo") String termo, @Param("empresaId") Long empresaId, Pageable pageable);
}
