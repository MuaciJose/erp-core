package com.grandport.erp.modules.compras.repository;

import com.grandport.erp.modules.compras.model.CompraXML;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompraXMLRepository extends JpaRepository<CompraXML, Long> {

    //Verifica se a nota já existe para evitar duplicidade!
    Optional<CompraXML> findByNumeroAndCnpjFornecedor(String numero, String cnpjFornecedor);
    Optional<CompraXML> findByEmpresaIdAndNumeroAndCnpjFornecedor(Long empresaId, String numero, String cnpjFornecedor);
    List<CompraXML> findAllByEmpresaIdOrderByDataImportacaoDesc(Long empresaId);
    Optional<CompraXML> findByEmpresaIdAndId(Long empresaId, Long id);
}
