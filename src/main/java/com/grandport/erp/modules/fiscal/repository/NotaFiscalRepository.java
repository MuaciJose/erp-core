package com.grandport.erp.modules.fiscal.repository;

import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotaFiscalRepository extends JpaRepository<NotaFiscal, Long> {

    // 🚀 Busca a nota pelo ID da Venda
    NotaFiscal findByVendaId(Long vendaId);

}