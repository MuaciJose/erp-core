package com.grandport.erp.modules.parceiro.repository;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ParceiroRepository extends JpaRepository<Parceiro, Long> {

    @Query("SELECT p FROM Parceiro p WHERE " +
           "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "p.documento LIKE CONCAT('%', :termo, '%')")
    List<Parceiro> buscarPorTermo(@Param("termo") String termo);
}
