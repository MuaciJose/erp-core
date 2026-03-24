package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    Optional<Produto> findByCodigoBarras(String codigoBarras);

    // 🚀 NOVO: O "Plano B" para achar a peça pelo código do fornecedor (SKU)
    Optional<Produto> findBySku(String sku);

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    List<Produto> findAlertasEstoque();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    Long countProdutosBaixoEstoque();

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo " +
            "AND p.id IN (SELECT iv.produto.id FROM ItemVenda iv GROUP BY iv.produto.id HAVING COUNT(iv) > 5)")
    List<Produto> findProdutosCriticosCurvaA();

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque > 10 " +
            "AND p.id NOT IN (SELECT iv.produto.id FROM ItemVenda iv WHERE iv.venda.dataHora >= :dataCorte)")
    List<Produto> findProdutosSemVendaDesde(@Param("dataCorte") LocalDateTime dataCorte);

    // 🚀 ATUALIZADO: Agora usa LOWER() em TUDO. Busca imbatível para a Referência Cruzada!
    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.referenciaOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.codigoBarras) LIKE LOWER(CONCAT('%', :termo, '%'))")
    List<Produto> buscarPorTermo(@Param("termo") String termo);

    // 🚀 ATUALIZADO: Busca Inteligente também blindada contra letras maiúsculas/minúsculas
    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.referenciaOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "p.codigoBarras = :termo")
    List<Produto> buscaInteligente(@Param("termo") String termo);

    List<Produto> findByReferenciaOriginalAndIdNot(String referenciaOriginal, Long id);

    // ============================================================================
    // 🔐 NOVOS MÉTODOS COM FILTRO DE EMPRESA (Defesa em Profundidade - SEGURO!)
    // ============================================================================

    /**
     * 🚀 Novo: Buscar todos os produtos de uma empresa específica
     * Isso garante isolamento mesmo se TenantId falhar
     */
    @Query("SELECT p FROM Produto p WHERE p.empresaId = :empresaId ORDER BY p.nome")
    List<Produto> findAllByEmpresa(@Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Alertas de estoque POR EMPRESA (seguro!)
     */
    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId ORDER BY p.nome")
    List<Produto> findAlertasEstoqueByEmpresa(@Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Contar baixo estoque POR EMPRESA
     */
    @Query("SELECT COUNT(p) FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo AND p.empresaId = :empresaId")
    Long countProdutosBaixoEstoqueByEmpresa(@Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Buscar por SKU dentro da empresa (evita duplicatas entre empresas)
     */
    @Query("SELECT p FROM Produto p WHERE p.sku = :sku AND p.empresaId = :empresaId")
    Optional<Produto> findBySkuAndEmpresa(@Param("sku") String sku, @Param("empresaId") Long empresaId);

    /**
     * 🚀 Novo: Buscar por código de barras dentro da empresa
     */
    @Query("SELECT p FROM Produto p WHERE p.codigoBarras = :codigo AND p.empresaId = :empresaId")
    Optional<Produto> findByCodigoBarrasAndEmpresa(@Param("codigo") String codigo, @Param("empresaId") Long empresaId);
}