package com.grandport.erp.modules.compras.repository;

import com.grandport.erp.modules.compras.model.CompraXML;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompraXMLRepository extends JpaRepository<CompraXML, Long> {
}