package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.Recibo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReciboRepository extends JpaRepository<Recibo, Long> {
    // Busca os recibos mais recentes primeiro
    List<Recibo> findAllByOrderByDataRegistroDesc();
}