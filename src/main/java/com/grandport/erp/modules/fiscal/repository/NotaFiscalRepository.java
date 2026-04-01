package com.grandport.erp.modules.fiscal.repository;

import com.grandport.erp.modules.fiscal.model.NotaFiscal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotaFiscalRepository extends JpaRepository<NotaFiscal, Long> {

    // 🚀 Busca a nota pelo ID da Venda
    NotaFiscal findByVendaId(Long vendaId);
    NotaFiscal findByEmpresaIdAndVendaId(Long empresaId, Long vendaId);
    List<NotaFiscal> findAllByEmpresaIdOrderByIdDesc(Long empresaId);
    Optional<NotaFiscal> findByEmpresaIdAndId(Long empresaId, Long id);
    Optional<NotaFiscal> findByEmpresaIdAndChaveAcesso(Long empresaId, String chaveAcesso);

}
