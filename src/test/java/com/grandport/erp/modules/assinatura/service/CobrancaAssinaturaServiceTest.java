package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.dto.CriarCobrancaDTO;
import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.repository.AssinaturaCobrancaRepository;
import com.grandport.erp.modules.assinatura.repository.CobrancaWebhookEventoRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Cobranca Assinatura Service")
class CobrancaAssinaturaServiceTest {

    @Mock
    private AssinaturaCobrancaRepository cobrancaRepository;

    @Mock
    private CobrancaWebhookEventoRepository webhookEventoRepository;

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private SecurityEventService securityEventService;

    @Mock
    private LicenciamentoModuloService licenciamentoModuloService;

    private CobrancaAssinaturaService cobrancaAssinaturaService;

    @Test
    @DisplayName("Deve compor cobrança com plano base e add-ons quando valor não vier no payload")
    void deveComporCobrancaComPlanoEAddons() {
        cobrancaAssinaturaService = new CobrancaAssinaturaService(
                cobrancaRepository,
                webhookEventoRepository,
                empresaRepository,
                securityEventService,
                licenciamentoModuloService,
                "token"
        );
        Empresa empresa = new Empresa();
        empresa.setId(7L);
        empresa.setPlano("PROFISSIONAL");
        empresa.setValorMensal(new BigDecimal("199.90"));

        when(empresaRepository.findById(7L)).thenReturn(Optional.of(empresa));
        when(licenciamentoModuloService.somarExtrasCobraveisEmpresa(7L)).thenReturn(new BigDecimal("59.90"));
        when(licenciamentoModuloService.listarExtrasCobraveisEmpresa(7L)).thenReturn(List.of("WhatsApp (R$ 39.90)", "Curva ABC (R$ 20.00)"));
        when(cobrancaRepository.save(any(AssinaturaCobranca.class))).thenAnswer(invocation -> invocation.getArgument(0));

        cobrancaAssinaturaService.criarCobranca(7L, new CriarCobrancaDTO(
                "MENSALIDADE-2026-05",
                null,
                LocalDate.now().plusDays(10).toString(),
                "MANUAL",
                null,
                null,
                null,
                null
        ));

        ArgumentCaptor<AssinaturaCobranca> captor = ArgumentCaptor.forClass(AssinaturaCobranca.class);
        verify(cobrancaRepository).save(captor.capture());
        assertEquals(new BigDecimal("259.80"), captor.getValue().getValor());
    }
}
