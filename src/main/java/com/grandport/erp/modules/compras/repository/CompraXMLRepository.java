package com.grandport.erp.modules.compras.repository;

import com.grandport.erp.modules.compras.model.CompraXML;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompraXMLRepository extends JpaRepository<CompraXML, Long> {

    //Verifica se a nota já existe para evitar duplicidade!
    Optional<CompraXML> findByNumeroAndCnpjFornecedor(String numero, String cnpjFornecedor);
}