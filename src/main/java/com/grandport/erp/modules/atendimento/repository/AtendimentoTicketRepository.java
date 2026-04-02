package com.grandport.erp.modules.atendimento.repository;

import com.grandport.erp.modules.atendimento.model.AtendimentoTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtendimentoTicketRepository extends JpaRepository<AtendimentoTicket, Long> {

    List<AtendimentoTicket> findByEmpresaIdOrderByUpdatedAtDesc(Long empresaId);

    List<AtendimentoTicket> findByStatusOrderByUpdatedAtDesc(String status);

    List<AtendimentoTicket> findAllByOrderByUpdatedAtDesc();
}
