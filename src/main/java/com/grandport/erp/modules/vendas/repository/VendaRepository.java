package com.grandport.erp.modules.vendas.repository;

import com.grandport.erp.modules.vendas.model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaRepository extends JpaRepository<Venda, Long> {
}
