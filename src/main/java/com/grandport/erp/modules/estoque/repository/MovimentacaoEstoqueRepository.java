package com.grandport.erp.modules.estoque.repository;

import com.grandport.erp.modules.estoque.model.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {
    @Query("SELECT m FROM MovimentacaoEstoque m WHERE m.produto.id = :produtoId AND m.empresaId = :empresaId ORDER BY m.dataMovimentacao DESC")
    List<MovimentacaoEstoque> findByProdutoIdAndEmpresaIdOrderByDataMovimentacaoDesc(@Param("produtoId") Long produtoId,
                                                                                      @Param("empresaId") Long empresaId);

    List<MovimentacaoEstoque> findByEmpresaIdOrderByDataMovimentacaoDesc(Long empresaId);
}
