package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.dto.VendaPerdidaRankingDTO;
import com.grandport.erp.modules.vendas.model.VendaPerdida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VendaPerdidaRepository extends JpaRepository<VendaPerdida, Long> {

    @Query("SELECT new com.grandport.erp.modules.vendas.dto.VendaPerdidaRankingDTO(LOWER(v.descricaoPeca), COUNT(v)) " +
           "FROM VendaPerdida v " +
           "WHERE v.dataRegistro >= :dataInicio " +
           "GROUP BY LOWER(v.descricaoPeca) " +
           "ORDER BY COUNT(v) DESC")
    List<VendaPerdidaRankingDTO> findRankingVendasPerdidas(@Param("dataInicio") LocalDateTime dataInicio);
}
