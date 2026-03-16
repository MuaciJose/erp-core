package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.model.Revisao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    // Traz todas as revisões que não estão concluídas nem canceladas
    List<Revisao> findByStatusNotInOrderByDataPrevistaAsc(List<String> status);
}