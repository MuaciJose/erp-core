package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.CaixaDiario;
import com.grandport.erp.modules.financeiro.model.StatusCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CaixaDiarioRepository extends JpaRepository<CaixaDiario, Long> {
    Optional<CaixaDiario> findByStatus(StatusCaixa status);
}
