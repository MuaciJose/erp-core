package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Ncm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NcmRepository extends JpaRepository<Ncm, String> {
    
    @Query("SELECT n FROM Ncm n WHERE n.codigo LIKE CONCAT('%', :termo, '%') OR LOWER(n.descricao) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Ncm> buscarPorTermo(@Param("termo") String termo);
}
