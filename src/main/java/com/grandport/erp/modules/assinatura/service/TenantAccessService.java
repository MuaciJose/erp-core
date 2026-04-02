package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TenantAccessService {

    private final EmpresaRepository empresaRepository;
    private final SecurityEventService securityEventService;

    @Transactional
    public void validarAcesso(Usuario usuario) {
        if (usuario == null || usuario.getTipoAcesso() == TipoAcesso.PLATFORM_ADMIN) {
            return;
        }

        Empresa empresa = empresaRepository.findById(usuario.getEmpresaId())
                .orElseThrow(() -> new TenantAccessBlockedException("A empresa vinculada a este usuário não foi encontrada."));

        if (!Boolean.TRUE.equals(empresa.getAtivo())) {
            throw blocked(usuario, empresa, "A empresa está inativa e não pode acessar o sistema.");
        }

        if (empresa.getStatusAssinatura() == StatusAssinatura.CANCELADA) {
            throw blocked(usuario, empresa, "A assinatura desta empresa foi cancelada. Contate a plataforma para regularização.");
        }

        if (empresa.getStatusAssinatura() == StatusAssinatura.BLOQUEADA) {
            String motivo = empresa.getMotivoBloqueio() == null || empresa.getMotivoBloqueio().isBlank()
                    ? "A empresa está bloqueada pela plataforma."
                    : empresa.getMotivoBloqueio();
            throw blocked(usuario, empresa, motivo);
        }

        if (empresa.getDataVencimento() != null && empresa.getDataVencimento().isBefore(LocalDate.now())) {
            LocalDate dataCorte = empresa.getDataVencimento()
                    .plusDays(Math.max(empresa.getDiasTolerancia() == null ? 0 : empresa.getDiasTolerancia(), 0));

            if (!dataCorte.isBefore(LocalDate.now())) {
                return;
            }

            if (empresa.getStatusAssinatura() == StatusAssinatura.ATIVA) {
                empresa.setStatusAssinatura(StatusAssinatura.INADIMPLENTE);
                empresa.setMotivoBloqueio("Assinatura vencida em " + empresa.getDataVencimento() + ".");
                empresaRepository.save(empresa);
            }
            throw blocked(usuario, empresa,
                    "A assinatura da empresa está vencida desde " + empresa.getDataVencimento() + ". Regularize o pagamento para liberar o acesso.");
        }

        if (empresa.getStatusAssinatura() == StatusAssinatura.INADIMPLENTE) {
            String motivo = empresa.getMotivoBloqueio() == null || empresa.getMotivoBloqueio().isBlank()
                    ? "A empresa está inadimplente."
                    : empresa.getMotivoBloqueio();
            throw blocked(usuario, empresa, motivo);
        }
    }

    private TenantAccessBlockedException blocked(Usuario usuario, Empresa empresa, String message) {
        securityEventService.registrar(
                empresa.getId(),
                "TENANT_BLOQUEADO",
                "WARN",
                usuario.getUsername(),
                null,
                message
        );
        return new TenantAccessBlockedException(message);
    }
}
