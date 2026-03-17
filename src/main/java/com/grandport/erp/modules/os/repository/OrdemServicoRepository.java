package com.grandport.erp.modules.os.repository;

import com.grandport.erp.modules.os.model.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// 🚀 IMPORTAÇÃO DA LISTA
import java.util.List;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    // 🚀 O Spring vai ler "findByClienteId" e criar o SQL automático para buscar o histórico do cliente
    List<OrdemServico> findByClienteId(Long clienteId);

    // 🚀 O Spring vai ler "findByVeiculoId" e criar o SQL automático para buscar o histórico do carro
    List<OrdemServico> findByVeiculoId(Long veiculoId);

}