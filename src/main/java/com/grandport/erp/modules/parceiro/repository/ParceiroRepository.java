package com.grandport.erp.modules.parceiro.repository;

import com.grandport.erp.modules.parceiro.model.Parceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParceiroRepository extends JpaRepository<Parceiro, Long> {

    Optional<Parceiro> findByEmpresaIdAndId(Long empresaId, Long id);
    Optional<Parceiro> findByEmpresaIdAndDocumento(Long empresaId, String documento);
    Optional<Parceiro> findByEmpresaIdAndNome(Long empresaId, String nome);
    List<Parceiro> findByEmpresaId(Long empresaId);

    @Query("SELECT p FROM Parceiro p WHERE " +
           "p.empresaId = :empresaId AND (" +
           "LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "p.documento LIKE CONCAT('%', :termo, '%'))")
    List<Parceiro> buscarPorTermo(@Param("termo") String termo, @Param("empresaId") Long empresaId);
}
