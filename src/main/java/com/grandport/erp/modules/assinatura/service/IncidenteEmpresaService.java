package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.assinatura.dto.EmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.dto.SalvarEmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.model.EmpresaIncidente;
import com.grandport.erp.modules.assinatura.repository.EmpresaIncidenteRepository;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class IncidenteEmpresaService {

    private final EmpresaIncidenteRepository empresaIncidenteRepository;
    private final EmpresaRepository empresaRepository;
    private final AuditoriaService auditoriaService;

    public IncidenteEmpresaService(EmpresaIncidenteRepository empresaIncidenteRepository,
                                   EmpresaRepository empresaRepository,
                                   AuditoriaService auditoriaService) {
        this.empresaIncidenteRepository = empresaIncidenteRepository;
        this.empresaRepository = empresaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<EmpresaIncidenteDTO> listarPorEmpresa(Long empresaId) {
        return empresaIncidenteRepository.findByEmpresaIdOrderByUpdatedAtDesc(empresaId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public EmpresaIncidenteDTO criar(Long empresaId, SalvarEmpresaIncidenteDTO dto, String operador) {
        empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada para registro do incidente."));

        EmpresaIncidente incidente = new EmpresaIncidente();
        incidente.setEmpresaId(empresaId);
        aplicarCampos(incidente, dto);
        incidente.setCreatedAt(LocalDateTime.now());
        incidente.setUpdatedAt(LocalDateTime.now());
        incidente.setCreatedBy(operador);
        incidente.setUpdatedBy(operador);
        EmpresaIncidente salvo = empresaIncidenteRepository.save(incidente);
        auditoriaService.registrar("SAAS", "INCIDENTE_EMPRESA", "Incidente criado para empresa " + empresaId + ": " + salvo.getTitulo());
        return toDto(salvo);
    }

    @Transactional
    public EmpresaIncidenteDTO atualizar(Long empresaId, Long incidenteId, SalvarEmpresaIncidenteDTO dto, String operador) {
        EmpresaIncidente incidente = empresaIncidenteRepository.findById(incidenteId)
                .orElseThrow(() -> new RuntimeException("Incidente não encontrado."));
        if (!empresaId.equals(incidente.getEmpresaId())) {
            throw new RuntimeException("Incidente não pertence à empresa informada.");
        }
        aplicarCampos(incidente, dto);
        incidente.setUpdatedAt(LocalDateTime.now());
        incidente.setUpdatedBy(operador);
        EmpresaIncidente salvo = empresaIncidenteRepository.save(incidente);
        auditoriaService.registrar("SAAS", "INCIDENTE_ATUALIZADO", "Incidente atualizado para empresa " + empresaId + ": " + salvo.getTitulo());
        return toDto(salvo);
    }

    @Transactional(readOnly = true)
    public long totalIncidentesAbertos() {
        return empresaIncidenteRepository.countAbertos();
    }

    @Transactional(readOnly = true)
    public long totalSlaVencido() {
        return empresaIncidenteRepository.countSlaVencido(LocalDate.now());
    }

    private void aplicarCampos(EmpresaIncidente incidente, SalvarEmpresaIncidenteDTO dto) {
        incidente.setTipo(valorOuPadrao(dto.tipo(), "OPERACIONAL"));
        incidente.setTitulo(valorObrigatorio(dto.titulo(), "Título do incidente é obrigatório."));
        incidente.setSeveridade(valorOuPadrao(dto.severidade(), "MEDIA"));
        incidente.setStatus(valorOuPadrao(dto.status(), "ABERTO"));
        incidente.setResponsavel(textoNormalizado(dto.responsavel()));
        incidente.setPrazoResposta(parseData(dto.prazoResposta()));
        incidente.setPrazoResolucao(parseData(dto.prazoResolucao()));
        incidente.setDescricao(textoNormalizado(dto.descricao()));
        incidente.setResolucao(textoNormalizado(dto.resolucao()));
    }

    private EmpresaIncidenteDTO toDto(EmpresaIncidente item) {
        return new EmpresaIncidenteDTO(
                item.getId(),
                item.getEmpresaId(),
                item.getTipo(),
                item.getTitulo(),
                item.getSeveridade(),
                item.getStatus(),
                item.getResponsavel(),
                item.getPrazoResposta() == null ? null : item.getPrazoResposta().toString(),
                item.getPrazoResolucao() == null ? null : item.getPrazoResolucao().toString(),
                item.getDescricao(),
                item.getResolucao(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().toString(),
                item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString(),
                item.getCreatedBy(),
                item.getUpdatedBy()
        );
    }

    private String valorObrigatorio(String valor, String mensagem) {
        String normalizado = textoNormalizado(valor);
        if (normalizado == null) {
            throw new RuntimeException(mensagem);
        }
        return normalizado;
    }

    private String valorOuPadrao(String valor, String padrao) {
        return textoNormalizado(valor) == null ? padrao : textoNormalizado(valor);
    }

    private String textoNormalizado(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private LocalDate parseData(String valor) {
        if (valor == null || valor.isBlank()) return null;
        try {
            return LocalDate.parse(valor);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Data inválida para incidente: " + valor);
        }
    }
}
