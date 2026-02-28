package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.vendas.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumTotalVendasPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT SUM(v.desconto) FROM Venda v WHERE v.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumTotalDescontosPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT SUM(iv.quantidade * iv.produto.precoCusto) FROM ItemVenda iv WHERE iv.venda.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumCmvPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.dataHora >= FUNCTION('DATE_TRUNC', 'MONTH', CURRENT_DATE)")
    Optional<BigDecimal> sumTotalVendasMesAtual();

    @Query("SELECT COUNT(v) FROM Venda v WHERE v.dataHora BETWEEN :inicio AND :fim")
    Long countVendasByData(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT new com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO$TopProdutoDTO(iv.produto.nome, SUM(iv.quantidade), SUM(iv.quantidade * iv.precoUnitario)) " +
           "FROM ItemVenda iv WHERE iv.venda.dataHora >= FUNCTION('DATE_TRUNC', 'MONTH', CURRENT_DATE) " +
           "GROUP BY iv.produto.nome ORDER BY SUM(iv.quantidade * iv.precoUnitario) DESC")
    List<DashboardResumoDTO.TopProdutoDTO> findTop5ProdutosMaisVendidosMes();
}
