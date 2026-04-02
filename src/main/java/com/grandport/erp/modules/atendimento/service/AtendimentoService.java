package com.grandport.erp.modules.atendimento.service;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.atendimento.dto.AbrirAtendimentoDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoMensagemDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoResumoDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoTemplateDTO;
import com.grandport.erp.modules.atendimento.dto.AtendimentoTicketDTO;
import com.grandport.erp.modules.atendimento.dto.AtualizarAtendimentoStatusDTO;
import com.grandport.erp.modules.atendimento.dto.EnviarAtendimentoMensagemDTO;
import com.grandport.erp.modules.atendimento.dto.SalvarAtendimentoTemplateDTO;
import com.grandport.erp.modules.atendimento.model.AtendimentoMensagem;
import com.grandport.erp.modules.atendimento.model.AtendimentoTemplate;
import com.grandport.erp.modules.atendimento.model.AtendimentoTicket;
import com.grandport.erp.modules.atendimento.repository.AtendimentoMensagemRepository;
import com.grandport.erp.modules.atendimento.repository.AtendimentoTemplateRepository;
import com.grandport.erp.modules.atendimento.repository.AtendimentoTicketRepository;
import com.grandport.erp.modules.assinatura.model.EmpresaIncidente;
import com.grandport.erp.modules.assinatura.repository.EmpresaIncidenteRepository;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Comparator;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AtendimentoService {

    private final AtendimentoTicketRepository ticketRepository;
    private final AtendimentoMensagemRepository mensagemRepository;
    private final AtendimentoTemplateRepository templateRepository;
    private final EmpresaRepository empresaRepository;
    private final EmpresaIncidenteRepository empresaIncidenteRepository;
    private final AuditoriaService auditoriaService;
    private final AtendimentoArquivoStorageService atendimentoArquivoStorageService;

    public AtendimentoService(AtendimentoTicketRepository ticketRepository,
                              AtendimentoMensagemRepository mensagemRepository,
                              AtendimentoTemplateRepository templateRepository,
                              EmpresaRepository empresaRepository,
                              EmpresaIncidenteRepository empresaIncidenteRepository,
                              AuditoriaService auditoriaService,
                              AtendimentoArquivoStorageService atendimentoArquivoStorageService) {
        this.ticketRepository = ticketRepository;
        this.mensagemRepository = mensagemRepository;
        this.templateRepository = templateRepository;
        this.empresaRepository = empresaRepository;
        this.empresaIncidenteRepository = empresaIncidenteRepository;
        this.auditoriaService = auditoriaService;
        this.atendimentoArquivoStorageService = atendimentoArquivoStorageService;
    }

    @Transactional(readOnly = true)
    public List<AtendimentoTicketDTO> listarMeusTickets() {
        Usuario usuario = usuarioAtual();
        return toTicketDtos(ticketRepository.findByEmpresaIdOrderByUpdatedAtDesc(usuario.getEmpresaId()));
    }

    @Transactional(readOnly = true)
    public List<AtendimentoMensagemDTO> listarMensagensDoMeuTicket(Long ticketId) {
        AtendimentoTicket ticket = validarTicketDoUsuario(ticketId);
        return toMensagemDtos(mensagemRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()));
    }

    @Transactional
    public AtendimentoTicketDTO abrirTicket(AbrirAtendimentoDTO dto) {
        Usuario usuario = usuarioAtual();
        AtendimentoTicket ticket = new AtendimentoTicket();
        ticket.setEmpresaId(usuario.getEmpresaId());
        ticket.setTitulo(textoObrigatorio(dto.titulo(), "Título do atendimento é obrigatório."));
        ticket.setCategoria(textoOuPadrao(dto.categoria(), "OPERACIONAL"));
        ticket.setPrioridade(textoOuPadrao(dto.prioridade(), "MEDIA"));
        ticket.setStatus("ABERTO");
        ticket.setClienteNome(nomeExibicao(usuario));
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUltimaMensagemAt(LocalDateTime.now());
        AtendimentoTicket salvo = ticketRepository.save(ticket);

        criarMensagemInterna(salvo, "CLIENTE", nomeExibicao(usuario), identificadorExibicao(usuario), perfilExibicao(usuario), textoObrigatorio(dto.mensagemInicial(), "Mensagem inicial é obrigatória."));
        auditoriaService.registrar("ATENDIMENTO", "ATENDIMENTO_ABERTO", "Ticket #" + salvo.getId() + " aberto pelo cliente.");
        return toTicketDto(salvo, nomeEmpresaPorId().get(salvo.getEmpresaId()), null, null);
    }

    @Transactional
    public AtendimentoMensagemDTO enviarMensagemCliente(Long ticketId, EnviarAtendimentoMensagemDTO dto) {
        AtendimentoTicket ticket = validarTicketDoUsuario(ticketId);
        validarTicketAbertoParaResposta(ticket);
        Usuario usuario = usuarioAtual();
        AtendimentoMensagem mensagem = criarMensagemInterna(ticket, "CLIENTE", nomeExibicao(usuario), identificadorExibicao(usuario), perfilExibicao(usuario), textoObrigatorio(dto.mensagem(), "Mensagem é obrigatória."));
        ticket.setStatus("AGUARDANDO_PLATAFORMA");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUltimaMensagemAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "MENSAGEM_CLIENTE", "Nova mensagem no ticket #" + ticket.getId());
        return toMensagemDto(mensagem);
    }

    @Transactional
    public AtendimentoMensagemDTO enviarAnexoCliente(Long ticketId, MultipartFile arquivo, String mensagemTexto) {
        AtendimentoTicket ticket = validarTicketDoUsuario(ticketId);
        validarTicketAbertoParaResposta(ticket);
        Usuario usuario = usuarioAtual();
        AtendimentoMensagem mensagem = criarMensagemComAnexo(ticket, "CLIENTE", nomeExibicao(usuario), identificadorExibicao(usuario), perfilExibicao(usuario), arquivo, mensagemTexto);
        ticket.setStatus("AGUARDANDO_PLATAFORMA");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUltimaMensagemAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "ANEXO_CLIENTE", "Cliente enviou anexo no ticket #" + ticket.getId());
        return toMensagemDto(mensagem);
    }

    @Transactional
    public AtendimentoTicketDTO encerrarMeuTicket(Long ticketId) {
        AtendimentoTicket ticket = validarTicketDoUsuario(ticketId);
        ticket.setStatus("ENCERRADO");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setClosedAt(LocalDateTime.now());
        AtendimentoTicket salvo = ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "ATENDIMENTO_ENCERRADO_CLIENTE", "Cliente encerrou ticket #" + salvo.getId());
        return toTicketDto(salvo, nomeEmpresaPorId().get(salvo.getEmpresaId()), incidentePorId(List.of(salvo)).get(salvo.getIncidenteId()), null);
    }

    @Transactional(readOnly = true)
    public AtendimentoResumoDTO resumoPlataforma() {
        validarAcessoPlataforma();
        List<AtendimentoTicket> tickets = ticketRepository.findAllByOrderByUpdatedAtDesc();
        Map<Long, EmpresaIncidente> incidentes = incidentePorId(tickets);
        List<Long> ticketIds = tickets.stream().map(AtendimentoTicket::getId).toList();
        Map<Long, List<AtendimentoMensagem>> mensagensPorTicket = mensagemRepository.findByTicketIdInOrderByCreatedAtAsc(ticketIds).stream()
                .collect(Collectors.groupingBy(AtendimentoMensagem::getTicketId));

        long aguardandoPlataforma = tickets.stream().filter(item -> "AGUARDANDO_PLATAFORMA".equalsIgnoreCase(item.getStatus())).count();
        long ticketsCriticos = tickets.stream().filter(item -> {
            EmpresaIncidente incidente = incidentes.get(item.getIncidenteId());
            return "CRITICA".equalsIgnoreCase(item.getPrioridade()) || (incidente != null && "CRITICA".equalsIgnoreCase(incidente.getSeveridade()));
        }).count();
        long slaVencido = tickets.stream().filter(item -> {
            EmpresaIncidente incidente = incidentes.get(item.getIncidenteId());
            return incidente != null && incidente.getPrazoResolucao() != null
                    && incidente.getPrazoResolucao().isBefore(LocalDateTime.now().toLocalDate())
                    && !statusFinalizado(incidente.getStatus());
        }).count();
        long semResponsavel = tickets.stream().filter(item -> !statusFinalizado(item.getStatus()) && textoNormalizado(item.getPlataformaResponsavel()) == null).count();
        long finalizados = tickets.stream().filter(item -> statusFinalizado(item.getStatus())).count();

        long tempoMedioPrimeiraResposta = (long) tickets.stream()
                .map(item -> calcularPrimeiraRespostaMinutos(item, mensagensPorTicket.getOrDefault(item.getId(), List.of())))
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .average()
                .orElse(0);

        return new AtendimentoResumoDTO(
                aguardandoPlataforma,
                ticketsCriticos,
                slaVencido,
                semResponsavel,
                finalizados,
                tempoMedioPrimeiraResposta
        );
    }

    @Transactional(readOnly = true)
    public List<AtendimentoTemplateDTO> listarTemplatesPlataforma() {
        validarAcessoPlataforma();
        return templateRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toTemplateDto)
                .toList();
    }

    @Transactional
    public AtendimentoTemplateDTO criarTemplatePlataforma(SalvarAtendimentoTemplateDTO dto) {
        validarAcessoPlataforma();
        AtendimentoTemplate item = new AtendimentoTemplate();
        item.setTitulo(textoObrigatorio(dto.titulo(), "Título do template é obrigatório."));
        item.setConteudo(textoObrigatorio(dto.conteudo(), "Conteúdo do template é obrigatório."));
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        item.setCreatedBy(nomeExibicao(usuarioAtual()));
        AtendimentoTemplate salvo = templateRepository.save(item);
        auditoriaService.registrar("ATENDIMENTO", "TEMPLATE_CRIADO", "Template de atendimento criado: " + salvo.getTitulo());
        return toTemplateDto(salvo);
    }

    @Transactional
    public void excluirTemplatePlataforma(Long templateId) {
        validarAcessoPlataforma();
        AtendimentoTemplate item = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template não encontrado."));
        templateRepository.delete(item);
        auditoriaService.registrar("ATENDIMENTO", "TEMPLATE_EXCLUIDO", "Template de atendimento removido: " + item.getTitulo());
    }

    @Transactional(readOnly = true)
    public List<AtendimentoTicketDTO> listarTicketsPlataforma(String status, String busca) {
        validarAcessoPlataforma();
        List<AtendimentoTicket> tickets = textoNormalizado(status) == null
                ? ticketRepository.findAllByOrderByUpdatedAtDesc()
                : ticketRepository.findByStatusOrderByUpdatedAtDesc(textoNormalizado(status).toUpperCase());
        String buscaNormalizada = textoNormalizado(busca) == null ? null : textoNormalizado(busca).toLowerCase();
        if (buscaNormalizada != null) {
            Map<Long, String> nomesEmpresa = nomeEmpresaPorId();
            tickets = tickets.stream().filter(item -> {
                String texto = String.join(" ",
                        nomesEmpresa.getOrDefault(item.getEmpresaId(), ""),
                        item.getTitulo(),
                        item.getCategoria(),
                        item.getClienteNome() == null ? "" : item.getClienteNome()
                ).toLowerCase();
                return texto.contains(buscaNormalizada);
            }).toList();
        }
        return toTicketDtos(tickets);
    }

    @Transactional(readOnly = true)
    public List<AtendimentoMensagemDTO> listarMensagensPlataforma(Long ticketId) {
        AtendimentoTicket ticket = validarTicketPlataforma(ticketId);
        return toMensagemDtos(mensagemRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()));
    }

    @Transactional
    public AtendimentoMensagemDTO enviarMensagemPlataforma(Long ticketId, EnviarAtendimentoMensagemDTO dto) {
        AtendimentoTicket ticket = validarTicketPlataforma(ticketId);
        validarTicketAbertoParaResposta(ticket);
        Usuario usuario = usuarioAtual();
        AtendimentoMensagem mensagem = criarMensagemInterna(ticket, "PLATAFORMA", nomeExibicao(usuario), identificadorExibicao(usuario), perfilExibicao(usuario), textoObrigatorio(dto.mensagem(), "Mensagem é obrigatória."));
        ticket.setStatus("AGUARDANDO_CLIENTE");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUltimaMensagemAt(LocalDateTime.now());
        ticket.setPlataformaResponsavel(nomeExibicao(usuario));
        ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "MENSAGEM_PLATAFORMA", "Plataforma respondeu ticket #" + ticket.getId());
        return toMensagemDto(mensagem);
    }

    @Transactional
    public AtendimentoMensagemDTO enviarAnexoPlataforma(Long ticketId, MultipartFile arquivo, String mensagemTexto) {
        AtendimentoTicket ticket = validarTicketPlataforma(ticketId);
        validarTicketAbertoParaResposta(ticket);
        Usuario usuario = usuarioAtual();
        AtendimentoMensagem mensagem = criarMensagemComAnexo(ticket, "PLATAFORMA", nomeExibicao(usuario), identificadorExibicao(usuario), perfilExibicao(usuario), arquivo, mensagemTexto);
        ticket.setStatus("AGUARDANDO_CLIENTE");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUltimaMensagemAt(LocalDateTime.now());
        ticket.setPlataformaResponsavel(nomeExibicao(usuario));
        ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "ANEXO_PLATAFORMA", "Plataforma enviou anexo no ticket #" + ticket.getId());
        return toMensagemDto(mensagem);
    }

    @Transactional
    public AtendimentoTicketDTO atualizarStatusPlataforma(Long ticketId, AtualizarAtendimentoStatusDTO dto) {
        AtendimentoTicket ticket = validarTicketPlataforma(ticketId);
        String status = textoObrigatorio(dto.status(), "Status do ticket é obrigatório.").toUpperCase();
        ticket.setStatus(status);
        ticket.setPlataformaResponsavel(textoNormalizado(dto.plataformaResponsavel()) == null ? nomeExibicao(usuarioAtual()) : textoNormalizado(dto.plataformaResponsavel()));
        ticket.setIncidenteId(dto.incidenteId());
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setClosedAt("RESOLVIDO".equals(status) || "ENCERRADO".equals(status) ? LocalDateTime.now() : null);
        AtendimentoTicket salvo = ticketRepository.save(ticket);
        auditoriaService.registrar("ATENDIMENTO", "STATUS_TICKET", "Ticket #" + salvo.getId() + " atualizado para " + status);
        return toTicketDto(salvo, nomeEmpresaPorId().get(salvo.getEmpresaId()), incidentePorId(List.of(salvo)).get(salvo.getIncidenteId()), null);
    }

    private AtendimentoTicket validarTicketDoUsuario(Long ticketId) {
        Usuario usuario = usuarioAtual();
        AtendimentoTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket não encontrado."));
        if (!ticket.getEmpresaId().equals(usuario.getEmpresaId()) && usuario.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Este ticket não pertence à empresa logada.");
        }
        return ticket;
    }

    private AtendimentoTicket validarTicketPlataforma(Long ticketId) {
        validarAcessoPlataforma();
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket não encontrado."));
    }

    private void validarTicketAbertoParaResposta(AtendimentoTicket ticket) {
        if (ticket == null) {
            throw new RuntimeException("Ticket não encontrado.");
        }
        String status = textoNormalizado(ticket.getStatus());
        if (status == null) {
            return;
        }
        String statusNormalizado = status.toUpperCase();
        if ("ENCERRADO".equals(statusNormalizado) || "RESOLVIDO".equals(statusNormalizado)) {
            throw new RuntimeException("Este atendimento já foi finalizado e não aceita novas mensagens.");
        }
    }

    private AtendimentoMensagem criarMensagemInterna(AtendimentoTicket ticket, String autorTipo, String autorNome, String autorLogin, String autorPerfil, String conteudo) {
        AtendimentoMensagem mensagem = new AtendimentoMensagem();
        mensagem.setTicketId(ticket.getId());
        mensagem.setEmpresaId(ticket.getEmpresaId());
        mensagem.setAutorTipo(autorTipo);
        mensagem.setAutorNome(autorNome);
        mensagem.setAutorLogin(autorLogin);
        mensagem.setAutorPerfil(autorPerfil);
        mensagem.setMensagem(conteudo);
        mensagem.setCreatedAt(LocalDateTime.now());
        return mensagemRepository.save(mensagem);
    }

    private AtendimentoMensagem criarMensagemComAnexo(AtendimentoTicket ticket, String autorTipo, String autorNome, String autorLogin, String autorPerfil, MultipartFile arquivo, String mensagemTexto) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RuntimeException("Selecione um arquivo para anexar.");
        }
        AtendimentoMensagem mensagem = new AtendimentoMensagem();
        mensagem.setTicketId(ticket.getId());
        mensagem.setEmpresaId(ticket.getEmpresaId());
        mensagem.setAutorTipo(autorTipo);
        mensagem.setAutorNome(autorNome);
        mensagem.setAutorLogin(autorLogin);
        mensagem.setAutorPerfil(autorPerfil);
        mensagem.setMensagem(textoNormalizado(mensagemTexto) == null
                ? "Anexo enviado: " + nomeArquivoOriginal(arquivo)
                : textoNormalizado(mensagemTexto));
        mensagem.setArquivoNome(nomeArquivoOriginal(arquivo));
        mensagem.setArquivoUrl(atendimentoArquivoStorageService.salvar(arquivo));
        mensagem.setCreatedAt(LocalDateTime.now());
        return mensagemRepository.save(mensagem);
    }

    private List<AtendimentoTicketDTO> toTicketDtos(List<AtendimentoTicket> tickets) {
        Map<Long, String> nomesEmpresa = nomeEmpresaPorId();
        Map<Long, EmpresaIncidente> incidentes = incidentePorId(tickets);
        Map<Long, AtendimentoMensagem> ultimasMensagens = ultimaMensagemPorTicket(tickets);
        return tickets.stream().map(item -> toTicketDto(
                item,
                nomesEmpresa.get(item.getEmpresaId()),
                incidentes.get(item.getIncidenteId()),
                ultimasMensagens.get(item.getId()))
        ).toList();
    }

    private AtendimentoTicketDTO toTicketDto(AtendimentoTicket item, String empresaNome, EmpresaIncidente incidente, AtendimentoMensagem ultimaMensagem) {
        return new AtendimentoTicketDTO(
                item.getId(),
                item.getEmpresaId(),
                empresaNome == null ? "EMPRESA #" + item.getEmpresaId() : empresaNome,
                item.getTitulo(),
                item.getCategoria(),
                item.getPrioridade(),
                item.getStatus(),
                item.getClienteNome(),
                item.getPlataformaResponsavel(),
                item.getIncidenteId(),
                incidente == null ? null : incidente.getTitulo(),
                incidente == null ? null : incidente.getStatus(),
                incidente == null ? null : incidente.getSeveridade(),
                incidente == null || incidente.getPrazoResposta() == null ? null : incidente.getPrazoResposta().toString(),
                incidente == null || incidente.getPrazoResolucao() == null ? null : incidente.getPrazoResolucao().toString(),
                item.getUltimaMensagemAt() == null ? null : item.getUltimaMensagemAt().toString(),
                ultimaMensagem == null ? null : ultimaMensagem.getAutorTipo(),
                ultimaMensagem == null ? null : ultimaMensagem.getAutorNome(),
                ultimaMensagem == null ? null : ultimaMensagem.getAutorLogin(),
                ultimaMensagem == null ? null : ultimaMensagem.getAutorPerfil(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().toString(),
                item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString(),
                item.getClosedAt() == null ? null : item.getClosedAt().toString()
        );
    }

    private List<AtendimentoMensagemDTO> toMensagemDtos(List<AtendimentoMensagem> mensagens) {
        return mensagens.stream().map(this::toMensagemDto).toList();
    }

    private AtendimentoMensagemDTO toMensagemDto(AtendimentoMensagem item) {
        return new AtendimentoMensagemDTO(
                item.getId(),
                item.getTicketId(),
                item.getEmpresaId(),
                item.getAutorTipo(),
                item.getAutorNome(),
                item.getAutorLogin(),
                item.getAutorPerfil(),
                item.getMensagem(),
                item.getArquivoNome(),
                item.getArquivoUrl(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().toString()
        );
    }

    private Map<Long, AtendimentoMensagem> ultimaMensagemPorTicket(List<AtendimentoTicket> tickets) {
        if (tickets == null || tickets.isEmpty()) {
            return Map.of();
        }

        List<Long> ticketIds = tickets.stream().map(AtendimentoTicket::getId).toList();
        return mensagemRepository.findByTicketIdInOrderByCreatedAtAsc(ticketIds).stream()
                .collect(Collectors.toMap(
                        AtendimentoMensagem::getTicketId,
                        item -> item,
                        (anterior, atual) -> atual
                ));
    }

    private AtendimentoTemplateDTO toTemplateDto(AtendimentoTemplate item) {
        return new AtendimentoTemplateDTO(
                item.getId(),
                item.getTitulo(),
                item.getConteudo(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().toString(),
                item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString(),
                item.getCreatedBy()
        );
    }

    private Map<Long, String> nomeEmpresaPorId() {
        return empresaRepository.findAll().stream()
                .collect(Collectors.toMap(item -> item.getId(), item -> item.getRazaoSocial(), (a, b) -> a));
    }

    private Map<Long, EmpresaIncidente> incidentePorId(List<AtendimentoTicket> tickets) {
        List<Long> ids = tickets.stream()
                .map(AtendimentoTicket::getIncidenteId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return empresaIncidenteRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(EmpresaIncidente::getId, Function.identity(), (a, b) -> a));
    }

    private Long calcularPrimeiraRespostaMinutos(AtendimentoTicket ticket, List<AtendimentoMensagem> mensagens) {
        if (ticket == null || ticket.getCreatedAt() == null) {
            return null;
        }
        return mensagens.stream()
                .filter(item -> "PLATAFORMA".equalsIgnoreCase(item.getAutorTipo()) && item.getCreatedAt() != null)
                .min(Comparator.comparing(AtendimentoMensagem::getCreatedAt))
                .map(item -> java.time.Duration.between(ticket.getCreatedAt(), item.getCreatedAt()).toMinutes())
                .orElse(null);
    }

    private boolean statusFinalizado(String status) {
        String normalizado = textoNormalizado(status);
        if (normalizado == null) return false;
        return "ENCERRADO".equalsIgnoreCase(normalizado)
                || "RESOLVIDO".equalsIgnoreCase(normalizado)
                || "CANCELADO".equalsIgnoreCase(normalizado);
    }

    private void validarAcessoPlataforma() {
        Usuario usuario = usuarioAtual();
        if (usuario.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Acesso restrito à plataforma.");
        }
    }

    private Usuario usuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario usuario)) {
            throw new RuntimeException("Usuário autenticado não encontrado.");
        }
        return usuario;
    }

    private String nomeExibicao(Usuario usuario) {
        return textoNormalizado(usuario.getNomeCompleto()) == null ? usuario.getUsername() : usuario.getNomeCompleto();
    }

    private String identificadorExibicao(Usuario usuario) {
        return textoNormalizado(usuario.getUsername());
    }

    private String perfilExibicao(Usuario usuario) {
        return usuario.getTipoAcesso() == null ? null : usuario.getTipoAcesso().name();
    }

    private String nomeArquivoOriginal(MultipartFile arquivo) {
        return textoNormalizado(arquivo.getOriginalFilename()) == null ? "arquivo" : textoNormalizado(arquivo.getOriginalFilename());
    }

    private String textoObrigatorio(String valor, String mensagem) {
        String normalizado = textoNormalizado(valor);
        if (normalizado == null) throw new RuntimeException(mensagem);
        return normalizado;
    }

    private String textoOuPadrao(String valor, String padrao) {
        return textoNormalizado(valor) == null ? padrao : textoNormalizado(valor).toUpperCase();
    }

    private String textoNormalizado(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
