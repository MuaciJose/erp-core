package com.grandport.erp.modules.os.repository;

import com.grandport.erp.modules.os.model.OrdemServico;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    List<OrdemServico> findByClienteId(Long clienteId);
    List<OrdemServico> findByVeiculoId(Long veiculoId);
    Optional<OrdemServico> findByEmpresaIdAndId(Long empresaId, Long id);
    List<OrdemServico> findAllByEmpresaIdOrderByDataEntradaDesc(Long empresaId);

    // 🛡️ NOVAS BUSCAS BLINDADAS
    @Query("SELECT os FROM OrdemServico os WHERE os.consultor.id = :consultorId AND os.empresaId = :empresaId")
    List<OrdemServico> findByConsultorIdAndEmpresaId(@Param("consultorId") Long consultorId, @Param("empresaId") Long empresaId, Sort sort);

    // 🛡️ BUSCA PARA MECÂNICOS: Acha qualquer OS onde ele tenha algum serviço para fazer
    @Query("SELECT DISTINCT os FROM OrdemServico os JOIN os.itensServicos s WHERE s.mecanico.id = :mecanicoId AND os.empresaId = :empresaId")
    List<OrdemServico> findByMecanicoIdAndEmpresaId(@Param("mecanicoId") Long mecanicoId, @Param("empresaId") Long empresaId, Sort sort);
}
