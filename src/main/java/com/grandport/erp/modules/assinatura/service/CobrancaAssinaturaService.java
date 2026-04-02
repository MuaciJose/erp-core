package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.dto.CobrancaAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.CriarCobrancaDTO;
import com.grandport.erp.modules.assinatura.dto.WebhookPagamentoDTO;
import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.model.CobrancaStatus;
import com.grandport.erp.modules.assinatura.model.CobrancaWebhookEvento;
import com.grandport.erp.modules.assinatura.repository.AssinaturaCobrancaRepository;
import com.grandport.erp.modules.assinatura.repository.CobrancaWebhookEventoRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CobrancaAssinaturaService {

    private final AssinaturaCobrancaRepository cobrancaRepository;
    private final CobrancaWebhookEventoRepository webhookEventoRepository;
    private final EmpresaRepository empresaRepository;
    private final SecurityEventService securityEventService;
    private final LicenciamentoModuloService licenciamentoModuloService;
    private final String webhookToken;

    public CobrancaAssinaturaService(
            AssinaturaCobrancaRepository cobrancaRepository,
            CobrancaWebhookEventoRepository webhookEventoRepository,
            EmpresaRepository empresaRepository,
            SecurityEventService securityEventService,
            LicenciamentoModuloService licenciamentoModuloService,
            @Value("${app.billing.webhook-token:}") String webhookToken) {
        this.cobrancaRepository = cobrancaRepository;
        this.webhookEventoRepository = webhookEventoRepository;
        this.empresaRepository = empresaRepository;
        this.securityEventService = securityEventService;
        this.licenciamentoModuloService = licenciamentoModuloService;
        this.webhookToken = webhookToken;
    }

    @Transactional(readOnly = true)
    public List<CobrancaAssinaturaDTO> listarPorEmpresa(Long empresaId) {
        return cobrancaRepository.findTop20ByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(empresaId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssinaturaCobranca> listarEntidadesPorEmpresa(Long empresaId) {
        return cobrancaRepository.findTop10ByEmpresaIdOrderByCreatedAtDesc(empresaId);
    }

    @Transactional
    public CobrancaAssinaturaDTO criarCobranca(Long empresaId, CriarCobrancaDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));

        if (dto.dataVencimento() == null || dto.dataVencimento().isBlank()) {
            throw new RuntimeException("Informe a data de vencimento da cobrança.");
        }

        BigDecimal valorPlano = empresa.getValorMensal() == null ? BigDecimal.ZERO : empresa.getValorMensal();
        BigDecimal valorExtras = licenciamentoModuloService.somarExtrasCobraveisEmpresa(empresaId);
        BigDecimal valorTotal = dto == null || dto.valor() == null || dto.valor() <= 0
                ? valorPlano.add(valorExtras)
                : BigDecimal.valueOf(dto.valor());

        if (valorTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Informe um valor válido para a cobrança.");
        }

        AssinaturaCobranca cobranca = new AssinaturaCobranca();
        cobranca.setEmpresaId(empresa.getId());
        cobranca.setReferencia(dto.referencia() == null || dto.referencia().isBlank()
                ? "MENSALIDADE-" + LocalDate.parse(dto.dataVencimento())
                : dto.referencia().trim().toUpperCase());
        cobranca.setValor(valorTotal);
        cobranca.setDataVencimento(LocalDate.parse(dto.dataVencimento()));
        cobranca.setGatewayNome(normalize(dto.gatewayNome()));
        cobranca.setGatewayCobrancaId(blankToNull(dto.gatewayCobrancaId()));
        cobranca.setPaymentLink(blankToNull(dto.paymentLink()));
        String descricaoBase = blankToNull(dto.descricao());
        if (descricaoBase == null) {
            descricaoBase = "Plano " + (empresa.getPlano() == null ? "ESSENCIAL" : empresa.getPlano()) + " - Base R$ " + valorPlano;
        }
        cobranca.setDescricao(descricaoBase);
        String observacoes = blankToNull(dto.observacoes());
        List<String> extras = licenciamentoModuloService.listarExtrasCobraveisEmpresa(empresaId);
        if (!extras.isEmpty()) {
            String extrasDescricao = "Add-ons cobrados: " + String.join(", ", extras) + ".";
            observacoes = observacoes == null ? extrasDescricao : observacoes + " | " + extrasDescricao;
        }
        cobranca.setObservacoes(observacoes);

        AssinaturaCobranca salva = cobrancaRepository.save(cobranca);
        securityEventService.registrar(
                empresa.getId(),
                "COBRANCA_CRIADA",
                "INFO",
                "PLATFORM",
                null,
                "Cobrança " + salva.getReferencia() + " criada com vencimento em " + salva.getDataVencimento() + " no valor de R$ " + salva.getValor() + "."
        );
        return toDto(salva);
    }

    @Transactional
    public void processarWebhook(WebhookPagamentoDTO dto, String tokenRecebido) {
        if (webhookToken != null && !webhookToken.isBlank() && !webhookToken.equals(tokenRecebido)) {
            throw new RuntimeException("Webhook de pagamento não autorizado.");
        }
        if (dto == null || dto.provider() == null || dto.provider().isBlank() || dto.eventType() == null || dto.eventType().isBlank()) {
            throw new RuntimeException("Payload de webhook inválido.");
        }

        if (dto.externalEventId() != null && !dto.externalEventId().isBlank()
                && webhookEventoRepository.findByProviderAndExternalEventId(dto.provider(), dto.externalEventId()).isPresent()) {
            return;
        }

        AssinaturaCobranca cobranca = localizarCobranca(dto);
        CobrancaWebhookEvento evento = new CobrancaWebhookEvento();
        evento.setEmpresaId(cobranca == null ? dto.empresaId() : cobranca.getEmpresaId());
        evento.setCobrancaId(cobranca == null ? null : cobranca.getId());
        evento.setProvider(dto.provider().trim().toUpperCase());
        evento.setEventType(dto.eventType().trim().toUpperCase());
        evento.setExternalEventId(blankToNull(dto.externalEventId()));
        evento.setPayloadJson(blankToNull(dto.payloadJson()));
        evento.setProcessed(false);
        webhookEventoRepository.save(evento);

        if (cobranca != null) {
            aplicarStatusWebhook(cobranca, dto);
            evento.setProcessed(true);
            webhookEventoRepository.save(evento);
        }
    }

    @Transactional(readOnly = true)
    public AssinaturaCobranca obterUltimaCobranca(Long empresaId) {
        return cobrancaRepository.findTopByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(empresaId).orElse(null);
    }

    @Transactional
    public void registrarPagamentoManual(Long empresaId, LocalDate novaDataVencimento) {
        AssinaturaCobranca cobranca = cobrancaRepository.findTopByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(empresaId)
                .orElse(null);
        if (cobranca == null) {
            licenciamentoModuloService.liberarBloqueiosAutomaticosPorPagamento(empresaId);
            return;
        }
        cobranca.setStatus(CobrancaStatus.PAGA);
        cobranca.setPaidAt(LocalDateTime.now());
        cobranca.setLastWebhookAt(LocalDateTime.now());
        if (novaDataVencimento != null) {
            cobranca.setObservacoes(appendObs(cobranca.getObservacoes(), "Pagamento manual registrado. Próximo vencimento: " + novaDataVencimento));
        }
        cobrancaRepository.save(cobranca);
        licenciamentoModuloService.liberarBloqueiosAutomaticosPorPagamento(empresaId);
    }

    private AssinaturaCobranca localizarCobranca(WebhookPagamentoDTO dto) {
        if (dto.gatewayCobrancaId() != null && !dto.gatewayCobrancaId().isBlank()) {
            return cobrancaRepository.findByGatewayNomeAndGatewayCobrancaId(
                    dto.provider().trim().toUpperCase(),
                    dto.gatewayCobrancaId().trim()
            ).orElse(null);
        }
        if (dto.empresaId() != null) {
            return cobrancaRepository.findTopByEmpresaIdOrderByDataVencimentoDescCreatedAtDesc(dto.empresaId()).orElse(null);
        }
        return null;
    }

    private void aplicarStatusWebhook(AssinaturaCobranca cobranca, WebhookPagamentoDTO dto) {
        String normalized = dto.status() == null ? dto.eventType() : dto.status();
        String status = normalized.trim().toUpperCase();
        Empresa empresa = empresaRepository.findById(cobranca.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Empresa da cobrança não encontrada."));

        switch (status) {
            case "PAID", "PAGA", "APPROVED", "SUCCEEDED" -> {
                cobranca.setStatus(CobrancaStatus.PAGA);
                cobranca.setPaidAt(dto.paidAt() == null || dto.paidAt().isBlank() ? LocalDateTime.now() : LocalDateTime.parse(dto.paidAt()));
                empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
                empresa.setMotivoBloqueio(null);
                empresa.setDataVencimento(cobranca.getDataVencimento().plusMonths(1));
                licenciamentoModuloService.liberarBloqueiosAutomaticosPorPagamento(empresa.getId());
            }
            case "OVERDUE", "VENCIDA", "EXPIRED" -> {
                cobranca.setStatus(CobrancaStatus.VENCIDA);
                if (empresa.getStatusAssinatura() == StatusAssinatura.ATIVA) {
                    empresa.setStatusAssinatura(StatusAssinatura.INADIMPLENTE);
                    empresa.setMotivoBloqueio("Cobrança vencida em " + cobranca.getDataVencimento() + ".");
                }
            }
            case "CANCELED", "CANCELADA" -> cobranca.setStatus(CobrancaStatus.CANCELADA);
            case "REFUNDED", "ESTORNADA", "CHARGEBACK" -> cobranca.setStatus(CobrancaStatus.ESTORNADA);
            default -> {
                return;
            }
        }

        cobranca.setLastWebhookAt(LocalDateTime.now());
        cobrancaRepository.save(cobranca);
        empresaRepository.save(empresa);
        securityEventService.registrar(
                empresa.getId(),
                "COBRANCA_WEBHOOK_PROCESSADO",
                "INFO",
                dto.provider(),
                null,
                "Webhook " + dto.eventType() + " processado para cobrança " + cobranca.getReferencia() + " com status " + cobranca.getStatus() + "."
        );
    }

    private CobrancaAssinaturaDTO toDto(AssinaturaCobranca cobranca) {
        return new CobrancaAssinaturaDTO(
                cobranca.getId(),
                cobranca.getEmpresaId(),
                cobranca.getReferencia(),
                cobranca.getValor() == null ? 0D : cobranca.getValor().doubleValue(),
                cobranca.getDataVencimento() == null ? null : cobranca.getDataVencimento().toString(),
                cobranca.getStatus() == null ? null : cobranca.getStatus().name(),
                cobranca.getGatewayNome(),
                cobranca.getGatewayCobrancaId(),
                cobranca.getPaymentLink(),
                cobranca.getDescricao(),
                cobranca.getObservacoes(),
                cobranca.getPaidAt() == null ? null : cobranca.getPaidAt().toString(),
                cobranca.getCreatedAt() == null ? null : cobranca.getCreatedAt().toString()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? "MANUAL" : value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String appendObs(String atual, String nova) {
        if (atual == null || atual.isBlank()) {
            return nova;
        }
        return atual + " | " + nova;
    }
}
