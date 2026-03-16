package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Ncm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NcmRepository extends JpaRepository<Ncm, String> {

    // Mantido para o seu Autocomplete antigo
    @Query("SELECT n FROM Ncm n WHERE " +
            "REPLACE(n.codigo, '.', '') LIKE CONCAT('%', :termo, '%') OR " +
            "LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Ncm> buscarPorTermo(@Param("termo") String termo);

    // 🚀 NOVO: Método otimizado para a Tela de Listagem (Traz a contagem de páginas)
    @Query("SELECT n FROM Ncm n WHERE " +
            "(:termo IS NULL OR :termo = '' OR " +
            "REPLACE(n.codigo, '.', '') LIKE CONCAT('%', :termo, '%') OR " +
            "LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%')))")
    Page<Ncm> buscarPaginado(@Param("termo") String termo, Pageable pageable);
}