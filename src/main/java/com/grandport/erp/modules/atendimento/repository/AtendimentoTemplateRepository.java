package com.grandport.erp.modules.atendimento.repository;

import com.grandport.erp.modules.atendimento.model.AtendimentoTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtendimentoTemplateRepository extends JpaRepository<AtendimentoTemplate, Long> {

    List<AtendimentoTemplate> findAllByOrderByUpdatedAtDesc();
}
