package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssinaturaSchedulerService {

    private final EmpresaRepository empresaRepository;
    private final SecurityEventService securityEventService;
    private final LicenciamentoModuloService licenciamentoModuloService;

    @Scheduled(cron = "${app.jobs.assinaturas.verificacao-cron:0 0 2 * * *}")
    @Transactional
    public void verificarInadimplenciaDiaria() {
        LocalDate hoje = LocalDate.now();
        List<Empresa> empresas = empresaRepository.findAll();
        int bloqueadas = 0;
        int addOnsBloqueados = 0;

        for (Empresa empresa : empresas) {
            if (!Boolean.TRUE.equals(empresa.getAtivo())) {
                continue;
            }
            if (empresa.getStatusAssinatura() == StatusAssinatura.BLOQUEADA || empresa.getStatusAssinatura() == StatusAssinatura.CANCELADA) {
                continue;
            }
            LocalDate dataCorte = empresa.getDataVencimento() == null
                    ? null
                    : empresa.getDataVencimento().plusDays(Math.max(empresa.getDiasTolerancia() == null ? 0 : empresa.getDiasTolerancia(), 0));
            if (empresa.getDataVencimento() != null && empresa.getDataVencimento().isBefore(hoje)) {
                String motivoAddon = "Bloqueio automático por inadimplência de add-ons. Vencimento em " + empresa.getDataVencimento() + ".";
                addOnsBloqueados += licenciamentoModuloService.bloquearAddonsPorInadimplencia(empresa.getId(), motivoAddon);
            }

            if (dataCorte == null || !dataCorte.isBefore(hoje)) {
                continue;
            }

            if (empresa.getStatusAssinatura() != StatusAssinatura.INADIMPLENTE) {
                empresa.setStatusAssinatura(StatusAssinatura.INADIMPLENTE);
                empresa.setMotivoBloqueio("Assinatura vencida em " + empresa.getDataVencimento() + " e fora da tolerância.");
                securityEventService.registrar(
                        empresa.getId(),
                        "ASSINATURA_INADIMPLENTE",
                        "WARN",
                        "SCHEDULER",
                        null,
                        "Empresa marcada automaticamente como inadimplente por vencimento em " + empresa.getDataVencimento() + " com tolerância de " + empresa.getDiasTolerancia() + " dia(s)."
                );
                bloqueadas++;
            }
        }

        if (bloqueadas > 0) {
            log.warn("Verificação diária de assinaturas marcou {} empresa(s) como inadimplente(s).", bloqueadas);
        } else {
            log.info("Verificação diária de assinaturas concluída sem bloqueios automáticos.");
        }

        if (addOnsBloqueados > 0) {
            log.warn("Verificação diária bloqueou comercialmente {} add-on(s) por atraso.", addOnsBloqueados);
        }

        int trialsExpirados = licenciamentoModuloService.expirarTrialsVencidos();
        if (trialsExpirados > 0) {
            log.warn("Verificação diária expirou {} trial(s) de módulos SaaS.", trialsExpirados);
        }
    }
}
