package com.grandport.erp.modules.os.repository;

import com.grandport.erp.modules.os.model.OrdemServico;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    List<OrdemServico> findByClienteId(Long clienteId);
    List<OrdemServico> findByVeiculoId(Long veiculoId);

    // 🛡️ NOVAS BUSCAS BLINDADAS
    List<OrdemServico> findByConsultorId(Long consultorId, Sort sort);

    // 🛡️ BUSCA PARA MECÂNICOS: Acha qualquer OS onde ele tenha algum serviço para fazer
    @Query("SELECT DISTINCT os FROM OrdemServico os JOIN os.itensServicos s WHERE s.mecanico.id = :mecanicoId")
    List<OrdemServico> findByMecanicoId(@Param("mecanicoId") Long mecanicoId, Sort sort);
}