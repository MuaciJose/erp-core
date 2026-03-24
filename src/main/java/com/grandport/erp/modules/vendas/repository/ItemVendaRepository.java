package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.model.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemVendaRepository extends JpaRepository<ItemVenda, Long> {

    // 🚀 SUA LÓGICA ATUAL: Média de vendas dos últimos 30 dias
    @Query(value = "SELECT COALESCE(SUM(iv.quantidade), 0) / 30.0 FROM itens_venda iv " +
            "JOIN vendas v ON iv.venda_id = v.id " +
            "WHERE iv.produto_id = :produtoId AND v.data_hora >= (CURRENT_DATE - INTERVAL '30' DAY)",
            nativeQuery = true)
    Double findMediaVendaDiariaByProdutoId(@Param("produtoId") Long produtoId);

    // 📊 Ranking para a Curva ABC
    // Agrupa por produto e soma faturamento (Quantidade * Preço Unitário na hora da venda)
    // Filtramos apenas vendas CONCLUIDAS para não poluir com orçamentos
    @Query("SELECT p.id, p.sku, p.nome, p.referenciaOriginal, SUM(i.quantidade), SUM(i.quantidade * i.precoUnitario) " +
            "FROM ItemVenda i " +
            "JOIN i.produto p " +
            "JOIN i.venda v " +
            "WHERE v.status = 'CONCLUIDA' " +
            "GROUP BY p.id, p.sku, p.nome, p.referenciaOriginal " +
            "ORDER BY SUM(i.quantidade * i.precoUnitario) DESC")
    List<Object[]> findRankingFaturamentoProdutos();
}