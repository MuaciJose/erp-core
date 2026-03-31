package com.grandport.erp.modules.agenda.repository;

import com.grandport.erp.modules.agenda.model.CompromissoAgenda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CompromissoAgendaRepository extends JpaRepository<CompromissoAgenda, Long> {

    List<CompromissoAgenda> findByEmpresaIdAndDataInicioBetweenOrderByDataInicioAsc(Long empresaId, LocalDateTime inicio, LocalDateTime fim);

    List<CompromissoAgenda> findByEmpresaIdAndUsuarioResponsavelIdAndDataInicioBetweenOrderByDataInicioAsc(
            Long empresaId,
            Long usuarioResponsavelId,
            LocalDateTime inicio,
            LocalDateTime fim
    );

    Optional<CompromissoAgenda> findByEmpresaIdAndId(Long empresaId, Long id);

    boolean existsByEmpresaIdAndOrigemModuloAndOrigemId(Long empresaId, String origemModulo, Long origemId);
}
