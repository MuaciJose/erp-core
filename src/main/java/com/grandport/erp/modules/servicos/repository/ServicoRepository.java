package com.grandport.erp.modules.servicos.repository;

import com.grandport.erp.modules.servicos.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Long> {

    // Busca serviços pelo nome para o autocomplete do frontend
    @Query("SELECT s FROM Servico s WHERE s.empresaId = :empresaId AND (" +
            "LOWER(s.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(s.codigo) LIKE LOWER(CONCAT('%', :busca, '%')))")
    List<Servico> buscarPorNomeOuCodigo(String busca, Long empresaId);

    List<Servico> findByEmpresaIdOrderByNomeAsc(Long empresaId);
    Optional<Servico> findByEmpresaIdAndId(Long empresaId, Long id);
}
