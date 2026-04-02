package com.grandport.erp.modules.atendimento.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.atendimento.dto.AbrirAtendimentoDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoResumoDTO;
import com.grandport.erp.modules.atendimento.dto.AtualizarAtendimentoStatusDTO;
import com.grandport.erp.modules.atendimento.dto.EnviarAtendimentoMensagemDTO;
import com.grandport.erp.modules.atendimento.model.AtendimentoMensagem;
import com.grandport.erp.modules.atendimento.model.AtendimentoTicket;
import com.grandport.erp.modules.atendimento.repository.AtendimentoMensagemRepository;
import com.grandport.erp.modules.atendimento.repository.AtendimentoTicketRepository;
import com.grandport.erp.modules.assinatura.repository.EmpresaIncidenteRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes - Atendimento Service")
class AtendimentoServiceTest {

    @Mock
    private AtendimentoTicketRepository ticketRepository;

    @Mock
    private AtendimentoMensagemRepository mensagemRepository;

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private EmpresaIncidenteRepository empresaIncidenteRepository;

    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private AtendimentoService atendimentoService;

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deve abrir ticket para a empresa do cliente")
    void deveAbrirTicketParaEmpresaDoCliente() {
        autenticar(usuarioTenant());

        Empresa empresa = new Empresa();
        empresa.setId(7L);
        empresa.setRazaoSocial("Oficina Modelo");

        when(empresaRepository.findAll()).thenReturn(List.of(empresa));
        when(ticketRepository.save(any(AtendimentoTicket.class))).thenAnswer(invocation -> {
            AtendimentoTicket item = invocation.getArgument(0);
            if (item.getId() == null) {
                item.setId(11L);
            }
            return item;
        });
        when(mensagemRepository.save(any(AtendimentoMensagem.class))).thenAnswer(invocation -> {
            AtendimentoMensagem item = invocation.getArgument(0);
            item.setId(21L);
            return item;
        });

        var dto = atendimentoService.abrirTicket(new AbrirAtendimentoDTO(
                "Sem acesso ao fiscal",
                "TECNICO",
                "ALTA",
                "Cliente relata erro ao abrir o módulo."
        ));

        assertEquals(11L, dto.id());
        assertEquals(7L, dto.empresaId());
        assertEquals("Oficina Modelo", dto.empresaNome());
        assertEquals("ABERTO", dto.status());
        verify(auditoriaService).registrar("ATENDIMENTO", "ATENDIMENTO_ABERTO", "Ticket #11 aberto pelo cliente.");
    }

    @Test
    @DisplayName("Deve atualizar status e incidente do ticket pela plataforma")
    void deveAtualizarStatusEIncidenteDoTicketPelaPlataforma() {
        autenticar(usuarioPlataforma());

        Empresa empresa = new Empresa();
        empresa.setId(7L);
        empresa.setRazaoSocial("Oficina Modelo");

        AtendimentoTicket ticket = new AtendimentoTicket();
        ticket.setId(18L);
        ticket.setEmpresaId(7L);
        ticket.setTitulo("Falha no chat");
        ticket.setCategoria("OPERACIONAL");
        ticket.setPrioridade("MEDIA");
        ticket.setStatus("ABERTO");
        ticket.setClienteNome("Cliente Operador");
        ticket.setCreatedAt(LocalDateTime.now().minusHours(2));
        ticket.setUpdatedAt(LocalDateTime.now().minusHours(1));
        ticket.setUltimaMensagemAt(LocalDateTime.now().minusMinutes(30));

        when(ticketRepository.findById(18L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(AtendimentoTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(empresaRepository.findAll()).thenReturn(List.of(empresa));

        var dto = atendimentoService.atualizarStatusPlataforma(18L, new AtualizarAtendimentoStatusDTO(
                "EM_ATENDIMENTO",
                "Owner SaaS",
                33L
        ));

        ArgumentCaptor<AtendimentoTicket> captor = ArgumentCaptor.forClass(AtendimentoTicket.class);
        verify(ticketRepository).save(captor.capture());
        AtendimentoTicket salvo = captor.getValue();

        assertEquals("EM_ATENDIMENTO", salvo.getStatus());
        assertEquals("Owner SaaS", salvo.getPlataformaResponsavel());
        assertEquals(33L, salvo.getIncidenteId());
        assertNotNull(salvo.getUpdatedAt());
        assertEquals(33L, dto.incidenteId());
        verify(auditoriaService).registrar("ATENDIMENTO", "STATUS_TICKET", "Ticket #18 atualizado para EM_ATENDIMENTO");
    }

    @Test
    @DisplayName("Nao deve permitir mensagem do cliente em ticket encerrado")
    void naoDevePermitirMensagemEmTicketEncerrado() {
        autenticar(usuarioTenant());

        AtendimentoTicket ticket = new AtendimentoTicket();
        ticket.setId(30L);
        ticket.setEmpresaId(7L);
        ticket.setStatus("ENCERRADO");

        when(ticketRepository.findById(30L)).thenReturn(Optional.of(ticket));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                atendimentoService.enviarMensagemCliente(30L, new EnviarAtendimentoMensagemDTO("Ainda preciso de ajuda"))
        );

        assertEquals("Este atendimento já foi finalizado e não aceita novas mensagens.", exception.getMessage());
        verify(mensagemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Nao deve permitir anexo do cliente em ticket encerrado")
    void naoDevePermitirAnexoEmTicketEncerrado() {
        autenticar(usuarioTenant());

        AtendimentoTicket ticket = new AtendimentoTicket();
        ticket.setId(31L);
        ticket.setEmpresaId(7L);
        ticket.setStatus("RESOLVIDO");

        when(ticketRepository.findById(31L)).thenReturn(Optional.of(ticket));

        MockMultipartFile arquivo = new MockMultipartFile(
                "file",
                "erro.txt",
                "text/plain",
                "log".getBytes()
        );

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                atendimentoService.enviarAnexoCliente(31L, arquivo, "Segue evidência")
        );

        assertEquals("Este atendimento já foi finalizado e não aceita novas mensagens.", exception.getMessage());
        verify(mensagemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve calcular resumo da plataforma com primeira resposta")
    void deveCalcularResumoDaPlataforma() {
        autenticar(usuarioPlataforma());

        AtendimentoTicket aguardando = new AtendimentoTicket();
        aguardando.setId(40L);
        aguardando.setEmpresaId(7L);
        aguardando.setPrioridade("CRITICA");
        aguardando.setStatus("AGUARDANDO_PLATAFORMA");
        aguardando.setCreatedAt(LocalDateTime.of(2026, 4, 2, 10, 0));

        AtendimentoTicket finalizado = new AtendimentoTicket();
        finalizado.setId(41L);
        finalizado.setEmpresaId(7L);
        finalizado.setPrioridade("MEDIA");
        finalizado.setStatus("ENCERRADO");
        finalizado.setPlataformaResponsavel("Owner");
        finalizado.setCreatedAt(LocalDateTime.of(2026, 4, 2, 9, 0));

        AtendimentoMensagem resposta = new AtendimentoMensagem();
        resposta.setTicketId(41L);
        resposta.setAutorTipo("PLATAFORMA");
        resposta.setCreatedAt(LocalDateTime.of(2026, 4, 2, 9, 20));

        when(ticketRepository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(aguardando, finalizado));
        when(mensagemRepository.findByTicketIdInOrderByCreatedAtAsc(List.of(40L, 41L))).thenReturn(List.of(resposta));
        AtendimentoResumoDTO dto = atendimentoService.resumoPlataforma();

        assertEquals(1, dto.aguardandoPlataforma());
        assertEquals(1, dto.ticketsCriticos());
        assertEquals(1, dto.semResponsavel());
        assertEquals(1, dto.finalizados());
        assertEquals(20, dto.tempoMedioPrimeiraRespostaMinutos());
    }

    private void autenticar(Usuario usuario) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities())
        );
    }

    private Usuario usuarioTenant() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmpresaId(7L);
        usuario.setUsername("cliente");
        usuario.setNomeCompleto("Cliente Operador");
        usuario.setTipoAcesso(TipoAcesso.TENANT_ADMIN);
        return usuario;
    }

    private Usuario usuarioPlataforma() {
        Usuario usuario = new Usuario();
        usuario.setId(2L);
        usuario.setEmpresaId(0L);
        usuario.setUsername("owner");
        usuario.setNomeCompleto("Owner SaaS");
        usuario.setTipoAcesso(TipoAcesso.PLATFORM_ADMIN);
        return usuario;
    }
}
