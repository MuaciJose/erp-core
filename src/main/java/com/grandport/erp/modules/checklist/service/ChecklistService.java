package com.grandport.erp.modules.checklist.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.checklist.dto.ChecklistRequestDTO;
import com.grandport.erp.modules.checklist.model.ChecklistVeiculo;
import com.grandport.erp.modules.checklist.repository.ChecklistRepository;
import com.grandport.erp.modules.configuracoes.service.EmpresaContextService;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChecklistService {

    @Autowired private ChecklistRepository checklistRepository;
    @Autowired private VeiculoRepository veiculoRepository;
    @Autowired private ParceiroRepository parceiroRepository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private EmpresaContextService empresaContextService;

    public List<ChecklistVeiculo> listarPorVeiculo(Long veiculoId) {
        return checklistRepository.findByEmpresaIdAndVeiculoIdOrderByDataRegistroDesc(
                empresaContextService.getRequiredEmpresaId(),
                veiculoId
        );
    }

    public ChecklistVeiculo buscarPorId(Long id) {
        return checklistRepository.findByEmpresaIdAndId(empresaContextService.getRequiredEmpresaId(), id)
                .orElseThrow(() -> new RuntimeException("Checklist não encontrado."));
    }

    public ChecklistVeiculo buscarMaisRecenteDaEmpresa() {
        return checklistRepository.findFirstByEmpresaIdOrderByDataRegistroDesc(empresaContextService.getRequiredEmpresaId())
                .orElse(null);
    }

    public List<ChecklistVeiculo> listarRecentesDaEmpresa() {
        return checklistRepository.findTop10ByEmpresaIdOrderByDataRegistroDesc(empresaContextService.getRequiredEmpresaId());
    }

    @Transactional
    public ChecklistVeiculo criar(ChecklistRequestDTO dto) {
        Long empresaId = empresaContextService.getRequiredEmpresaId();
        Veiculo veiculo = veiculoRepository.findByEmpresaIdAndId(empresaId, dto.veiculoId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));

        Parceiro cliente = null;
        if (dto.clienteId() != null) {
            cliente = parceiroRepository.findByEmpresaIdAndId(empresaId, dto.clienteId()).orElse(null);
        }

        // Pega o recepcionista logado no sistema
        Usuario recepcionista = null;
        try {
            recepcionista = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } catch (Exception e) {
            // Ignora caso esteja em ambiente de teste sem autenticação
        }

        ChecklistVeiculo checklist = new ChecklistVeiculo();
        checklist.setEmpresaId(empresaId);
        checklist.setVeiculo(veiculo);
        checklist.setCliente(cliente);
        checklist.setRecepcionista(recepcionista);
        checklist.setKmAtual(dto.kmAtual());
        checklist.setNivelCombustivel(dto.nivelCombustivel());
        checklist.setItensAvariados(dto.itensAvariados());
        checklist.setObservacoesGerais(dto.observacoesGerais());

        // Proteção contra lista nula
        if (dto.fotos() != null) {
            checklist.getFotos().addAll(dto.fotos());
        }

        checklist.setUrlAssinaturaCliente(dto.urlAssinaturaCliente());

        // 🚀 INTELIGÊNCIA: Se o KM do checklist for maior que o cadastrado, atualiza o carro!
        if (dto.kmAtual() != null && (veiculo.getKm() == null || dto.kmAtual() > veiculo.getKm())) {
            veiculo.setKm(dto.kmAtual());
            veiculoRepository.save(veiculo);
        }

        ChecklistVeiculo salvo = checklistRepository.save(checklist);

        // 🚀 AUDITORIA
        String placa = veiculo.getPlaca() != null ? veiculo.getPlaca() : "S/ Placa";
        auditoriaService.registrar("SERVICOS", "CRIACAO_CHECKLIST",
                "Realizou checklist de entrada para o veículo " + placa + ". Fotos anexadas: " + salvo.getFotos().size());

        return salvo;
    }
}
