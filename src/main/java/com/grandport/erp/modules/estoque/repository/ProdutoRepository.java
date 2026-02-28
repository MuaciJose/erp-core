package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    Optional<Produto> findByCodigoBarras(String codigoBarras);

    @Query("SELECT p FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    List<Produto> findAlertasEstoque();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.quantidadeEstoque <= p.estoqueMinimo")
    Long countProdutosBaixoEstoque();

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
