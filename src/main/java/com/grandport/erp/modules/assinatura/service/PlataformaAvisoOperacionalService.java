package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.assinatura.dto.PlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.dto.SalvarPlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.model.PlataformaAvisoOperacional;
import com.grandport.erp.modules.assinatura.repository.PlataformaAvisoOperacionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlataformaAvisoOperacionalService {

    private final PlataformaAvisoOperacionalRepository plataformaAvisoOperacionalRepository;

    @Transactional(readOnly = true)
    public PlataformaAvisoOperacionalDTO obterAvisoManutencao() {
        return toDto(obterOuCriarAvisoManutencao());
    }

    @Transactional
    public PlataformaAvisoOperacionalDTO salvarAvisoManutencao(SalvarPlataformaAvisoOperacionalDTO dto, String updatedBy) {
        PlataformaAvisoOperacional aviso = obterOuCriarAvisoManutencao();
        aviso.setAtivo(dto != null && Boolean.TRUE.equals(dto.ativo()));
        aviso.setSeveridade(textoNormalizado(dto == null ? null : dto.severidade()) == null ? "MANUTENCAO" : textoNormalizado(dto.severidade()).toUpperCase());
        aviso.setBloquearAcesso(dto != null && Boolean.TRUE.equals(dto.bloquearAcesso()));
        aviso.setTitulo(textoNormalizado(dto == null ? null : dto.titulo()) == null ? "Manutenção programada" : textoNormalizado(dto.titulo()));
        aviso.setMensagem(textoNormalizado(dto == null ? null : dto.mensagem()));
        aviso.setInicioPrevisto(parseDataHora(dto == null ? null : dto.inicioPrevisto()));
        aviso.setFimPrevisto(parseDataHora(dto == null ? null : dto.fimPrevisto()));
        aviso.setUpdatedAt(LocalDateTime.now());
        aviso.setUpdatedBy(updatedBy);
        return toDto(plataformaAvisoOperacionalRepository.save(aviso));
    }

    @Transactional(readOnly = true)
    public boolean manutencaoBloqueandoAcesso() {
        PlataformaAvisoOperacional aviso = obterOuCriarAvisoManutencao();
        if (!aviso.isAtivo() || !aviso.isBloquearAcesso()) {
            return false;
        }

        LocalDateTime agora = LocalDateTime.now();
        if (aviso.getInicioPrevisto() != null && agora.isBefore(aviso.getInicioPrevisto())) {
            return false;
        }
        if (aviso.getFimPrevisto() != null && agora.isAfter(aviso.getFimPrevisto())) {
            return false;
        }
        return true;
    }

    private PlataformaAvisoOperacional obterOuCriarAvisoManutencao() {
        return plataformaAvisoOperacionalRepository.findFirstByTipoOrderByIdAsc("MANUTENCAO")
                .orElseGet(() -> {
                    PlataformaAvisoOperacional aviso = new PlataformaAvisoOperacional();
                    aviso.setTipo("MANUTENCAO");
                    aviso.setTitulo("Manutenção programada");
                    aviso.setUpdatedAt(LocalDateTime.now());
                    aviso.setUpdatedBy("SISTEMA");
                    return plataformaAvisoOperacionalRepository.save(aviso);
                });
    }

    private PlataformaAvisoOperacionalDTO toDto(PlataformaAvisoOperacional aviso) {
        return new PlataformaAvisoOperacionalDTO(
                aviso.isAtivo(),
                aviso.getSeveridade(),
                aviso.isBloquearAcesso(),
                aviso.getTitulo(),
                aviso.getMensagem(),
                aviso.getInicioPrevisto() == null ? null : aviso.getInicioPrevisto().toString(),
                aviso.getFimPrevisto() == null ? null : aviso.getFimPrevisto().toString(),
                aviso.getUpdatedAt() == null ? null : aviso.getUpdatedAt().toString(),
                aviso.getUpdatedBy()
        );
    }

    private LocalDateTime parseDataHora(String valor) {
        String normalizado = textoNormalizado(valor);
        return normalizado == null ? null : LocalDateTime.parse(normalizado);
    }

    private String textoNormalizado(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
