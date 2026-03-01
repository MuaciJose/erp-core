package com.grandport.erp.modules.veiculo.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.dto.HistoricoVeiculoDTO;
import com.grandport.erp.modules.veiculo.dto.TransferenciaForcadaDTO;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VeiculoService {

    @Autowired private VeiculoRepository repository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private VendaRepository vendaRepository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private PasswordEncoder passwordEncoder;

    public List<Veiculo> listarPorCliente(Long clienteId) {
        return repository.findByClienteId(clienteId);
    }

    public List<HistoricoVeiculoDTO> buscarHistorico(Long veiculoId) {
        return vendaRepository.findByVeiculoIdOrderByDataHoraDesc(veiculoId).stream()
            .map(venda -> new HistoricoVeiculoDTO(
                venda.getId(),
                venda.getDataHora(),
                venda.getKmVeiculo(),
                venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final",
                venda.getItens().stream()
                    .map(item -> new HistoricoVeiculoDTO.ItemHistoricoDTO(item.getProduto().getNome(), item.getPrecoUnitario()))
                    .collect(Collectors.toList())
            ))
            .collect(Collectors.toList());
    }

    @Transactional
    public Veiculo cadastrar(Long clienteId, Veiculo veiculo) {
        // Verifica se a placa já existe
        Optional<Veiculo> existente = repository.findByPlacaIgnoreCase(veiculo.getPlaca());
        if (existente.isPresent()) {
            // Lança uma exceção customizada que o Controller capturará para retornar 409
            throw new VeiculoConflitoException(existente.get());
        }

        Parceiro cliente = parceiroRepository.findById(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));
        
        veiculo.setCliente(cliente);
        Veiculo salvo = repository.save(veiculo);
        
        auditoriaService.registrar("CADASTROS", "CRIACAO_VEICULO", "Cadastrou veículo " + salvo.getPlaca() + " para o cliente " + cliente.getNome());
        return salvo;
    }

    @Transactional
    public void transferirDono(Long veiculoId, Long novoClienteId) {
        Veiculo veiculo = repository.findById(veiculoId)
            .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));
        
        Parceiro antigoDono = veiculo.getCliente();
        Parceiro novoDono = parceiroRepository.findById(novoClienteId)
            .orElseThrow(() -> new RuntimeException("Novo dono não encontrado."));

        veiculo.setCliente(novoDono);
        repository.save(veiculo);

        auditoriaService.registrar("CADASTROS", "TRANSFERENCIA_VEICULO", 
            "Transferiu veículo " + veiculo.getPlaca() + " de " + antigoDono.getNome() + " para " + novoDono.getNome());
    }

    @Transactional
    public void transferenciaForcada(TransferenciaForcadaDTO dto) {
        // 1. Valida a senha do operador logado
        Usuario operador = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!passwordEncoder.matches(dto.getSenhaOperador(), operador.getSenha())) {
            throw new RuntimeException("Senha de autorização incorreta.");
        }

        // 2. Executa a transferência
        transferirDono(dto.getVeiculoId(), dto.getNovoClienteId());
        
        auditoriaService.registrar("CADASTROS", "TRANSFERENCIA_FORCADA", 
            "Operador " + operador.getNomeCompleto() + " forçou transferência do veículo ID " + dto.getVeiculoId());
    }

    // Exceção interna para sinalizar o conflito
    public static class VeiculoConflitoException extends RuntimeException {
        private final Veiculo veiculo;
        public VeiculoConflitoException(Veiculo veiculo) { this.veiculo = veiculo; }
        public Veiculo getVeiculo() { return veiculo; }
    }
}
