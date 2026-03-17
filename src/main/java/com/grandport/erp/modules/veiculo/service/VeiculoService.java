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
// 🚀 IMPORTAÇÕES DA OS
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.model.OrdemServico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    // 🚀 INJETANDO O REPOSITÓRIO DE OS
    @Autowired private OrdemServicoRepository osRepository;

    public List<Veiculo> listarPorCliente(Long clienteId) {
        return repository.findByClienteId(clienteId);
    }

    // 🚀 HISTÓRICO MISTO DO CARRO: VENDAS + OS
    public List<HistoricoVeiculoDTO> buscarHistorico(Long veiculoId) {

        // 1. Busca Vendas Diretas de balcão vinculadas ao carro
        List<HistoricoVeiculoDTO> historico = vendaRepository.findByVeiculoIdOrderByDataHoraDesc(veiculoId).stream()
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

        // 2. Busca Ordens de Serviço vinculadas ao carro
        List<OrdemServico> oss = osRepository.findByVeiculoId(veiculoId);

        for (OrdemServico os : oss) {
            List<HistoricoVeiculoDTO.ItemHistoricoDTO> itensMapeados = new ArrayList<>();

            // Mapeia Peças
            os.getItensPecas().forEach(p ->
                    itensMapeados.add(new HistoricoVeiculoDTO.ItemHistoricoDTO("[PEÇA] " + p.getProduto().getNome(), p.getPrecoUnitario()))
            );
            // Mapeia Mão de Obra
            os.getItensServicos().forEach(s ->
                    itensMapeados.add(new HistoricoVeiculoDTO.ItemHistoricoDTO("[SERVIÇO] " + s.getServico().getNome(), s.getPrecoUnitario()))
            );

            historico.add(new HistoricoVeiculoDTO(
                    os.getId(),
                    os.getDataEntrada(), // 🚀 Usando o campo exato da sua entidade
                    os.getKmEntrada(),
                    os.getCliente() != null ? os.getCliente().getNome() : "Sem Cliente",
                    itensMapeados
            ));
        }

        // 3. Ordena cronologicamente
        historico.sort((h1, h2) -> {
            if (h1.getData() == null || h2.getData() == null) return 0;
            return h2.getData().compareTo(h1.getData()); // 🚀 Trocado para getData()
        });

        return historico;
    }

    @Transactional
    public Veiculo cadastrar(Long clienteId, Veiculo veiculo) {
        Optional<Veiculo> existente = repository.findByPlacaIgnoreCase(veiculo.getPlaca());
        if (existente.isPresent()) {
            throw new VeiculoConflitoException(existente.get());
        }

        Parceiro cliente = parceiroRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));

        veiculo.setCliente(cliente);
        Veiculo salvo = repository.save(veiculo);

        String placa = salvo.getPlaca() != null ? salvo.getPlaca().toUpperCase() : "S/ Placa";
        auditoriaService.registrar("CADASTROS", "CRIACAO_VEICULO", "Cadastrou o veículo placa " + placa + " para o cliente '" + cliente.getNome() + "'");

        return salvo;
    }

    @Transactional
    public void transferirDono(Long veiculoId, Long novoClienteId) {
        Veiculo veiculo = repository.findById(veiculoId)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));

        Parceiro antigoDono = veiculo.getCliente();
        String nomeAntigoDono = antigoDono != null ? antigoDono.getNome() : "Sem dono anterior";

        Parceiro novoDono = parceiroRepository.findById(novoClienteId)
                .orElseThrow(() -> new RuntimeException("Novo dono não encontrado."));

        veiculo.setCliente(novoDono);
        repository.save(veiculo);

        String placa = veiculo.getPlaca() != null ? veiculo.getPlaca().toUpperCase() : "S/ Placa";
        auditoriaService.registrar("CADASTROS", "TRANSFERENCIA_VEICULO",
                "Transferiu o veículo " + placa + " de '" + nomeAntigoDono + "' para '" + novoDono.getNome() + "'");
    }

    @Transactional
    public void transferenciaForcada(TransferenciaForcadaDTO dto) {
        Usuario operador = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!passwordEncoder.matches(dto.getSenhaOperador(), operador.getSenha())) {
            throw new RuntimeException("Senha de autorização incorreta.");
        }

        transferirDono(dto.getVeiculoId(), dto.getNovoClienteId());

        auditoriaService.registrar("SEGURANCA", "TRANSFERENCIA_FORCADA",
                "ALERTA CRÍTICO: O Operador '" + operador.getNomeCompleto() + "' utilizou sua senha pessoal para FORÇAR a transferência de titularidade do veículo ID " + dto.getVeiculoId() + " para o cliente ID " + dto.getNovoClienteId());
    }

    public static class VeiculoConflitoException extends RuntimeException {
        private final Veiculo veiculo;
        public VeiculoConflitoException(Veiculo veiculo) { this.veiculo = veiculo; }
        public Veiculo getVeiculo() { return veiculo; }
    }
}