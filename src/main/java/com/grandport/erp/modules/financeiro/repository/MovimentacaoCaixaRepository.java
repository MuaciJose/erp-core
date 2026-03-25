package com.grandport.erp.modules.financeiro.repository;

import com.grandport.erp.modules.financeiro.model.MovimentacaoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimentacaoCaixaRepository extends JpaRepository<MovimentacaoCaixa, Long> {
    List<MovimentacaoCaixa> findByDataMovimentacaoBetween(LocalDateTime inicio, LocalDateTime fim);
    List<MovimentacaoCaixa> findByEmpresaIdAndDataMovimentacaoBetween(Long empresaId, LocalDateTime inicio, LocalDateTime fim);
}
