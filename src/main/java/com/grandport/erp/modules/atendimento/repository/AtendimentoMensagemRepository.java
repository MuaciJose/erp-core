package com.grandport.erp.modules.atendimento.repository;

import com.grandport.erp.modules.atendimento.model.AtendimentoMensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

public interface AtendimentoMensagemRepository extends JpaRepository<AtendimentoMensagem, Long> {

    List<AtendimentoMensagem> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    List<AtendimentoMensagem> findByTicketIdInOrderByCreatedAtAsc(Collection<Long> ticketIds);
}
