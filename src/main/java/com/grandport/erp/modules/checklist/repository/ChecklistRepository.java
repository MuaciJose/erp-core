package com.grandport.erp.modules.checklist.repository;

import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChecklistRepository extends JpaRepository<ChecklistVeiculo, Long> {

    // O Spring cria o SQL sozinho para buscar o histórico de um carro específico
    List<ChecklistVeiculo> findByVeiculoIdOrderByDataRegistroDesc(Long veiculoId);

    List<ChecklistVeiculo> findByDataRegistroBefore(LocalDateTime dataCorte);

}