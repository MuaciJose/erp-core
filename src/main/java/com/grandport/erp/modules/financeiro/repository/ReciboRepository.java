package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.Recibo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReciboRepository extends JpaRepository<Recibo, Long> {
    // Busca os recibos mais recentes primeiro
    List<Recibo> findByEmpresaIdOrderByDataRegistroDesc(Long empresaId);
    Optional<Recibo> findByEmpresaIdAndId(Long empresaId, Long id);
}
