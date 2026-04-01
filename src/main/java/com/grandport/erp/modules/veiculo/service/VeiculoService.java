package com.grandport.erp.modules.veiculo.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.dto.HistoricoVeiculoDTO;
import com.grandport.erp.modules.veiculo.dto.TransferenciaForcadaDTO;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;

// 🚀 IMPORTAÇÕES DA OS E CHECKLIST
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.checklist.repository.ChecklistRepository;
import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
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
    @Autowired private EmpresaContextService empresaContextService;

    // 🚀 INJETANDO OS REPOSITÓRIOS DA OFICINA
    @Autowired private OrdemServicoRepository osRepository;
    @Autowired private ChecklistRepository checklistRepository;

    public List<Veiculo> listarPorCliente(Long clienteId) {
        return repository.findByEmpresaIdAndClienteId(empresaContextService.getRequiredEmpresaId(), clienteId);
    }

    // 🚀 HISTÓRICO MISTO DO CARRO: VENDAS + OS + CHECKLISTS (REFATORADO COM BUILDER)
    public List<HistoricoVeiculoDTO> buscarHistorico(Long veiculoId) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        repository.findByEmpresaIdAndId(empresaId, veiculoId)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));

        List<HistoricoVeiculoDTO> historico = new ArrayList<>();

        // =========================================================
        // 1. Busca Vendas Diretas de balcão vinculadas ao carro
        // =========================================================
        vendaRepository.findByVeiculoIdOrderByDataHoraDesc(veiculoId).forEach(venda -> {
            historico.add(HistoricoVeiculoDTO.builder()
                    .tipo("VENDA")
                    .data(venda.getDataHora())
                    .idReferencia(venda.getId())
                    .dadosOs(HistoricoVeiculoDTO.DadosOsDTO.builder()
                            .clienteComprador(venda.getCliente() != null ? venda.getCliente().getNome() : "Consumidor Final")
                            .kmRegistrado(venda.getKmVeiculo())
                            .itens(venda.getItens().stream()
                                    .map(item -> HistoricoVeiculoDTO.ItemHistoricoDTO.builder()
                                            .descricao("[BALCÃO] " + item.getProduto().getNome())
                                            .valor(item.getPrecoUnitario())
                                            .build())
                                    .collect(Collectors.toList()))
                            .build())
                    .build());
        });

        // =========================================================
        // 2. Busca Ordens de Serviço vinculadas ao carro
        // =========================================================
        List<OrdemServico> oss = osRepository.findByVeiculoId(veiculoId);
        for (OrdemServico os : oss) {
            List<HistoricoVeiculoDTO.ItemHistoricoDTO> itensMapeados = new ArrayList<>();

            // Mapeia Peças
            os.getItensPecas().forEach(p -> itensMapeados.add(
                    HistoricoVeiculoDTO.ItemHistoricoDTO.builder()
                            .descricao("[PEÇA] " + p.getProduto().getNome())
                            .valor(p.getPrecoUnitario())
                            .build()
            ));

            // Mapeia Mão de Obra
            os.getItensServicos().forEach(s -> itensMapeados.add(
                    HistoricoVeiculoDTO.ItemHistoricoDTO.builder()
                            .descricao("[SERVIÇO] " + s.getServico().getNome())
                            .valor(s.getPrecoUnitario())
                            .build()
            ));

            historico.add(HistoricoVeiculoDTO.builder()
                    .tipo("OS")
                    .data(os.getDataEntrada())
                    .idReferencia(os.getId())
                    .dadosOs(HistoricoVeiculoDTO.DadosOsDTO.builder()
                            .clienteComprador(os.getCliente() != null ? os.getCliente().getNome() : "Sem Cliente")
                            .kmRegistrado(os.getKmEntrada())
                            .itens(itensMapeados)
                            .build())
                    .build());
        }

        // =========================================================
        // 3. Busca Checklists de Vistoria vinculados ao carro
        // =========================================================
        List<ChecklistVeiculo> checklists = checklistRepository.findByVeiculoIdOrderByDataRegistroDesc(veiculoId);
        for (ChecklistVeiculo chk : checklists) {
            historico.add(HistoricoVeiculoDTO.builder()
                    .tipo("CHECKLIST")
                    .data(chk.getDataRegistro())
                    .idReferencia(chk.getId())
                    .dadosChecklist(HistoricoVeiculoDTO.DadosChecklistDTO.builder()
                            .kmAtual(chk.getKmAtual())
                            .nivelCombustivel(chk.getNivelCombustivel())
                            .itensAvariados(chk.getItensAvariados())
                            .observacoes(chk.getObservacoesGerais())
                            .fotos(chk.getFotos())
                            // 🚀 AQUI ESTÁ A NOSSA LINHA para a assinatura!
                            .urlAssinaturaCliente(chk.getUrlAssinaturaCliente())
                            .build())
                    .build());
        }

        // =========================================================
        // 4. Ordena tudo cronologicamente (do mais recente pro mais antigo)
        // =========================================================
        // Usando o Comparator moderno do Java que é mais limpo e seguro contra nulos
        historico.sort(Comparator.comparing(HistoricoVeiculoDTO::getData,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        return historico;
    }

    @Transactional
    public Veiculo cadastrar(Long clienteId, Veiculo veiculo) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Optional<Veiculo> existente = repository.findByEmpresaIdAndPlacaIgnoreCase(empresaId, veiculo.getPlaca());
        if (existente.isPresent()) {
            throw new VeiculoConflitoException(existente.get());
        }

        Parceiro cliente = parceiroRepository.findByEmpresaIdAndId(empresaId, clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado."));

        veiculo.setCliente(cliente);
        veiculo.setEmpresaId(empresaId);
        Veiculo salvo = repository.save(veiculo);

        String placa = salvo.getPlaca() != null ? salvo.getPlaca().toUpperCase() : "S/ Placa";
        auditoriaService.registrar("CADASTROS", "CRIACAO_VEICULO", "Cadastrou o veículo placa " + placa + " para o cliente '" + cliente.getNome() + "'");

        return salvo;
    }

    @Transactional
    public void transferirDono(Long veiculoId, Long novoClienteId) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Veiculo veiculo = repository.findByEmpresaIdAndId(empresaId, veiculoId)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));

        Parceiro antigoDono = veiculo.getCliente();
        String nomeAntigoDono = antigoDono != null ? antigoDono.getNome() : "Sem dono anterior";

        Parceiro novoDono = parceiroRepository.findByEmpresaIdAndId(empresaId, novoClienteId)
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
