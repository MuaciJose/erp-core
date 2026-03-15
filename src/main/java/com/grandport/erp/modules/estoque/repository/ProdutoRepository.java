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

    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "p.referenciaOriginal LIKE CONCAT('%', :termo, '%') OR " +
            "p.sku LIKE CONCAT('%', :termo, '%') OR " +
            "p.codigoBarras LIKE CONCAT('%', :termo, '%')")
    List<Produto> buscarPorTermo(@Param("termo") String termo);

    @Query("SELECT p FROM Produto p WHERE " +
            "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(p.aplicacao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "p.referenciaOriginal LIKE CONCAT('%', :termo, '%') OR " +
            "p.codigoBarras = :termo")
    List<Produto> buscaInteligente(@Param("termo") String termo);

    List<Produto> findByReferenciaOriginalAndIdNot(String referenciaOriginal, Long id);
}