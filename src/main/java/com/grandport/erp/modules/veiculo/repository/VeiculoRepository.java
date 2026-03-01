package com.grandport.erp.modules.veiculo.repository;

import com.grandport.erp.modules.veiculo.model.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    List<Veiculo> findByClienteId(Long clienteId);
    Optional<Veiculo> findByPlacaIgnoreCase(String placa);
}
