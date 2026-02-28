package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.model.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemVendaRepository extends JpaRepository<ItemVenda, Long> {

    @Query(value = "SELECT COALESCE(SUM(iv.quantidade), 0) / 30.0 FROM itens_venda iv " +
                   "JOIN vendas v ON iv.venda_id = v.id " +
                   "WHERE iv.produto_id = :produtoId AND v.data_hora >= (CURRENT_DATE - INTERVAL '30' DAY)",
           nativeQuery = true)
    Double findMediaVendaDiariaByProdutoId(@Param("produtoId") Long produtoId);
}
