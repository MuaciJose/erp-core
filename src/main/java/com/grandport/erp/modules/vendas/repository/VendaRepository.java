package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO;
import com.grandport.erp.modules.vendas.model.StatusVenda;
import com.grandport.erp.modules.vendas.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    List<Venda> findByVeiculoIdOrderByDataHoraDesc(Long veiculoId);
    List<Venda> findByClienteIdOrderByDataHoraDesc(Long clienteId);

    List<Venda> findByStatus(StatusVenda status);

    List<Venda> findByVendedorId(Long vendedorId);

    List<Venda> findByVendedorId(Long vendedorId, Sort sort);
    List<Venda> findByStatusAndVendedorId(StatusVenda status, Long vendedorId);

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumTotalVendasPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT SUM(v.desconto) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumTotalDescontosPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT SUM(iv.quantidade * iv.produto.precoCusto) FROM ItemVenda iv WHERE iv.venda.status = 'CONCLUIDA' AND iv.venda.dataHora BETWEEN :inicio AND :fim")
    Optional<BigDecimal> sumCmvPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COUNT(v) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim")
    Long countVendasByData(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT new com.grandport.erp.modules.financeiro.dto.DashboardResumoDTO$TopProdutoDTO(iv.produto.nome, SUM(iv.quantidade), SUM(iv.quantidade * iv.precoUnitario)) " +
           "FROM ItemVenda iv WHERE iv.venda.status = 'CONCLUIDA' " +
           "GROUP BY iv.produto.nome ORDER BY SUM(iv.quantidade * iv.precoUnitario) DESC")
    List<DashboardResumoDTO.TopProdutoDTO> findTop5ProdutosMaisVendidosMes();

    @Query("SELECT v FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim ORDER BY v.vendedorNome, v.dataHora")
    List<Venda> buscarVendasParaRelatorio(LocalDateTime inicio, LocalDateTime fim);

    // ============================================================================
    // 🔐 NOVOS MÉTODOS COM FILTRO DE EMPRESA (Defesa em Profundidade - SEGURO!)
    // ============================================================================

    /**
     * 🚀 Novo: Buscar todas as vendas de uma empresa específica
     */
    @Query("SELECT v FROM Venda v WHERE v.empresaId = :empresaId ORDER BY v.dataHora DESC")
    List<Venda> findAllByEmpresa(@Param("empresaId") Long empresaId);

    Optional<Venda> findByEmpresaIdAndId(Long empresaId, Long id);

    /**
     * 🚀 Novo: Buscar vendas por status e empresa
     */
    @Query("SELECT v FROM Venda v WHERE v.status = :status AND v.empresaId = :empresaId ORDER BY v.dataHora DESC")
    List<Venda> findByStatusAndEmpresa(@Param("status") StatusVenda status, @Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Buscar vendas de um vendedor em uma empresa específica
     */
    @Query("SELECT v FROM Venda v WHERE v.vendedorId = :vendedorId AND v.empresaId = :empresaId ORDER BY v.dataHora DESC")
    List<Venda> findByVendedorIdAndEmpresa(@Param("vendedorId") Long vendedorId, @Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Somar vendas por período de uma empresa específica
     */
    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
    Optional<BigDecimal> sumTotalVendasPeriodoEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Somar descontos por período de uma empresa específica
     */
    @Query("SELECT SUM(v.desconto) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
    Optional<BigDecimal> sumTotalDescontosPeriodoEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Contar vendas por período de uma empresa específica
     */
    @Query("SELECT COUNT(v) FROM Venda v WHERE v.status = 'CONCLUIDA' AND v.dataHora BETWEEN :inicio AND :fim AND v.empresaId = :empresaId")
    Long countVendasByDataEmpresa(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("empresaId") Long empresaId);
}
