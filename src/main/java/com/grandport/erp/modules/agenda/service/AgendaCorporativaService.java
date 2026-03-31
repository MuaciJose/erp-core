package com.grandport.erp.modules.agenda.service;

import com.grandport.erp.modules.agenda.dto.AgendaResumoDTO;
import com.grandport.erp.modules.agenda.dto.AgendaSugestaoDTO;
import com.grandport.erp.modules.agenda.model.CompromissoAgenda;
import com.grandport.erp.modules.agenda.repository.CompromissoAgendaRepository;
import com.grandport.erp.modules.parceiro.model.Parceiro;
import com.grandport.erp.modules.parceiro.repository.ParceiroRepository;
import com.grandport.erp.modules.os.model.OrdemServico;
import com.grandport.erp.modules.os.repository.OrdemServicoRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.veiculo.model.Veiculo;
import com.grandport.erp.modules.veiculo.repository.VeiculoRepository;
import com.grandport.erp.modules.vendas.model.Revisao;
import com.grandport.erp.modules.vendas.model.Venda;
import com.grandport.erp.modules.vendas.repository.RevisaoRepository;
import com.grandport.erp.modules.vendas.repository.VendaRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AgendaCorporativaService {

    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final CompromissoAgendaRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ParceiroRepository parceiroRepository;
    private final VeiculoRepository veiculoRepository;
    private final RevisaoRepository revisaoRepository;
    private final VendaRepository vendaRepository;
    private final OrdemServicoRepository ordemServicoRepository;

    public AgendaCorporativaService(
            CompromissoAgendaRepository repository,
            UsuarioRepository usuarioRepository,
            ParceiroRepository parceiroRepository,
            VeiculoRepository veiculoRepository,
            RevisaoRepository revisaoRepository,
            VendaRepository vendaRepository,
            OrdemServicoRepository ordemServicoRepository
    ) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.parceiroRepository = parceiroRepository;
        this.veiculoRepository = veiculoRepository;
        this.revisaoRepository = revisaoRepository;
        this.vendaRepository = vendaRepository;
        this.ordemServicoRepository = ordemServicoRepository;
    }

    public List<CompromissoAgenda> listar(LocalDate dataInicio, LocalDate dataFim, String status, String setor, Long usuarioResponsavelId) {
        Long empresaId = usuarioLogado().getEmpresaId();
        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(LocalTime.MAX);

        List<CompromissoAgenda> compromissos;
        if (usuarioResponsavelId != null) {
            compromissos = repository.findByEmpresaIdAndUsuarioResponsavelIdAndDataInicioBetweenOrderByDataInicioAsc(
                    empresaId,
                    usuarioResponsavelId,
                    inicio,
                    fim
            );
        } else {
            compromissos = repository.findByEmpresaIdAndDataInicioBetweenOrderByDataInicioAsc(empresaId, inicio, fim);
        }

        return compromissos.stream()
                .filter(item -> status == null || status.isBlank() || status.equalsIgnoreCase(item.getStatus()))
                .filter(item -> setor == null || setor.isBlank() || setor.equalsIgnoreCase(item.getSetor()))
                .sorted(Comparator
                        .comparingInt((CompromissoAgenda item) -> calcularPesoCriticidade(item, dataInicio)).reversed()
                        .thenComparing(CompromissoAgenda::getDataInicio))
                .toList();
    }

    public CompromissoAgenda criar(CompromissoAgenda compromisso) {
        Usuario usuario = usuarioLogado();
        compromisso.setEmpresaId(usuario.getEmpresaId());
        hidratarReferencias(compromisso, usuario.getEmpresaId());
        return repository.save(compromisso);
    }

    public CompromissoAgenda atualizar(Long id, CompromissoAgenda payload) {
        Usuario usuario = usuarioLogado();
        CompromissoAgenda atual = repository.findByEmpresaIdAndId(usuario.getEmpresaId(), id)
                .orElseThrow(() -> new RuntimeException("Compromisso não encontrado."));

        atual.setTitulo(payload.getTitulo());
        atual.setDescricao(payload.getDescricao());
        atual.setTipo(payload.getTipo());
        atual.setSetor(payload.getSetor());
        atual.setPrioridade(payload.getPrioridade());
        atual.setStatus(payload.getStatus());
        atual.setDataInicio(payload.getDataInicio());
        atual.setDataFim(payload.getDataFim());
        atual.setParceiroId(payload.getParceiroId());
        atual.setVeiculoId(payload.getVeiculoId());
        atual.setUsuarioResponsavelId(payload.getUsuarioResponsavelId());
        atual.setOrigemModulo(payload.getOrigemModulo());
        atual.setOrigemId(payload.getOrigemId());
        atual.setLembreteWhatsApp(payload.getLembreteWhatsApp());
        atual.setObservacaoInterna(payload.getObservacaoInterna());

        if ("CONCLUIDO".equalsIgnoreCase(payload.getStatus())) {
            atual.setConcluidoEm(LocalDateTime.now());
        } else if (!"CONCLUIDO".equalsIgnoreCase(payload.getStatus())) {
            atual.setConcluidoEm(null);
        }

        hidratarReferencias(atual, usuario.getEmpresaId());
        return repository.save(atual);
    }

    public CompromissoAgenda atualizarStatus(Long id, String status) {
        Usuario usuario = usuarioLogado();
        CompromissoAgenda atual = repository.findByEmpresaIdAndId(usuario.getEmpresaId(), id)
                .orElseThrow(() -> new RuntimeException("Compromisso não encontrado."));
        atual.setStatus(status);
        atual.setConcluidoEm("CONCLUIDO".equalsIgnoreCase(status) ? LocalDateTime.now() : null);
        return repository.save(atual);
    }

    public void excluir(Long id) {
        Usuario usuario = usuarioLogado();
        CompromissoAgenda atual = repository.findByEmpresaIdAndId(usuario.getEmpresaId(), id)
                .orElseThrow(() -> new RuntimeException("Compromisso não encontrado."));
        repository.delete(atual);
    }

    public AgendaResumoDTO resumo(LocalDate data) {
        List<CompromissoAgenda> base = listar(data.minusDays(7), data.plusDays(30), null, null, null);
        long total = base.size();
        long hoje = base.stream().filter(item -> item.getDataInicio().toLocalDate().isEqual(data)).count();
        long atrasados = base.stream()
                .filter(item -> item.getDataInicio().toLocalDate().isBefore(data))
                .filter(item -> !"CONCLUIDO".equalsIgnoreCase(item.getStatus()))
                .count();
        long concluidos = base.stream().filter(item -> "CONCLUIDO".equalsIgnoreCase(item.getStatus())).count();
        long altaPrioridade = base.stream().filter(item -> "ALTA".equalsIgnoreCase(item.getPrioridade())).count();
        return new AgendaResumoDTO(total, hoje, atrasados, concluidos, altaPrioridade);
    }

    public List<AgendaSugestaoDTO> sugerirHorarios(LocalDate data, int duracaoMinutos, Long usuarioResponsavelId) {
        Usuario usuario = usuarioLogado();
        Long responsavel = usuarioResponsavelId != null ? usuarioResponsavelId : usuario.getId();
        List<CompromissoAgenda> ocupados = repository.findByEmpresaIdAndUsuarioResponsavelIdAndDataInicioBetweenOrderByDataInicioAsc(
                usuario.getEmpresaId(),
                responsavel,
                data.atStartOfDay(),
                data.atTime(LocalTime.MAX)
        );

        List<AgendaSugestaoDTO> sugestoes = new ArrayList<>();
        LocalDateTime cursor = calcularInicioBusca(data);
        LocalDateTime limite = data.atTime(18, 0);

        while (!cursor.plusMinutes(duracaoMinutos).isAfter(limite) && sugestoes.size() < 6) {
            if (estaNoHorarioDeAlmoco(cursor, duracaoMinutos)) {
                cursor = data.atTime(13, 0);
                continue;
            }

            LocalDateTime inicioSlot = cursor;
            LocalDateTime fim = inicioSlot.plusMinutes(duracaoMinutos);
            boolean conflita = ocupados.stream().anyMatch(item ->
                    inicioSlot.isBefore(item.getDataFim()) && fim.isAfter(item.getDataInicio())
            );

            if (!conflita) {
                sugestoes.add(new AgendaSugestaoDTO(
                        inicioSlot,
                        fim,
                        montarLabelSugestao(data, inicioSlot, fim, sugestoes.size())
                ));
            }

            cursor = inicioSlot.plusMinutes(30);
        }

        return sugestoes;
    }

    public CompromissoAgenda criarAPartirDaRevisao(Long revisaoId) {
        Usuario usuario = usuarioLogado();
        Revisao revisao = revisaoRepository.findByEmpresaIdAndId(usuario.getEmpresaId(), revisaoId)
                .orElseThrow(() -> new RuntimeException("Revisão não encontrada."));

        if (repository.existsByEmpresaIdAndOrigemModuloAndOrigemId(usuario.getEmpresaId(), "REVISAO", revisao.getId())) {
            throw new RuntimeException("Já existe um compromisso de agenda para esta revisão.");
        }

        return repository.save(montarCompromissoDaRevisao(revisao, usuario.getEmpresaId()));
    }

    public CompromissoAgenda criarAPartirDaVenda(Long vendaId) {
        Usuario usuario = usuarioLogado();
        Venda venda = vendaRepository.findByEmpresaIdAndId(usuario.getEmpresaId(), vendaId)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada."));

        CompromissoAgenda compromisso = new CompromissoAgenda();
        compromisso.setEmpresaId(usuario.getEmpresaId());
        compromisso.setTitulo("Follow-up comercial da venda #" + venda.getId());
        compromisso.setDescricao(venda.getObservacoes() != null && !venda.getObservacoes().isBlank()
                ? venda.getObservacoes()
                : "Retorno comercial do documento #" + venda.getId());
        compromisso.setTipo("VENDA");
        compromisso.setSetor("COMERCIAL");
        compromisso.setPrioridade("ORCAMENTO".equalsIgnoreCase(venda.getStatus().name()) ? "ALTA" : "NORMAL");
        compromisso.setStatus("AGENDADO");
        compromisso.setDataInicio(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        compromisso.setDataFim(compromisso.getDataInicio().plusMinutes(30));
        compromisso.setParceiroId(venda.getCliente() != null ? venda.getCliente().getId() : null);
        compromisso.setVeiculoId(venda.getVeiculo() != null ? venda.getVeiculo().getId() : null);
        compromisso.setUsuarioResponsavelId(venda.getVendedorId());
        compromisso.setOrigemModulo("VENDA");
        compromisso.setOrigemId(venda.getId());
        compromisso.setLembreteWhatsApp(venda.getCliente() != null && venda.getCliente().getTelefone() != null);
        compromisso.setObservacaoInterna("Criado automaticamente a partir do módulo de vendas.");
        hidratarReferencias(compromisso, usuario.getEmpresaId());
        return repository.save(compromisso);
    }

    public CompromissoAgenda criarAPartirDaOs(Long osId) {
        Usuario usuario = usuarioLogado();
        OrdemServico os = ordemServicoRepository.findByEmpresaIdAndId(usuario.getEmpresaId(), osId)
                .orElseThrow(() -> new RuntimeException("OS não encontrada."));

        CompromissoAgenda compromisso = new CompromissoAgenda();
        compromisso.setEmpresaId(usuario.getEmpresaId());
        compromisso.setTitulo("Acompanhamento da OS #" + os.getId());
        compromisso.setDescricao(os.getDefeitoRelatado() != null && !os.getDefeitoRelatado().isBlank()
                ? os.getDefeitoRelatado()
                : "Retorno operacional da ordem de serviço.");
        compromisso.setTipo("OS");
        compromisso.setSetor("RECEPCAO");
        compromisso.setPrioridade("ALTA");
        compromisso.setStatus("AGENDADO");
        compromisso.setDataInicio(LocalDateTime.now().plusDays(1).withHour(8).withMinute(30).withSecond(0).withNano(0));
        compromisso.setDataFim(compromisso.getDataInicio().plusMinutes(30));
        compromisso.setParceiroId(os.getCliente() != null ? os.getCliente().getId() : null);
        compromisso.setVeiculoId(os.getVeiculo() != null ? os.getVeiculo().getId() : null);
        compromisso.setUsuarioResponsavelId(os.getConsultor() != null ? os.getConsultor().getId() : null);
        compromisso.setOrigemModulo("OS");
        compromisso.setOrigemId(os.getId());
        compromisso.setLembreteWhatsApp(os.getCliente() != null && os.getCliente().getTelefone() != null);
        compromisso.setObservacaoInterna("Criado automaticamente a partir do módulo de ordem de serviço.");
        hidratarReferencias(compromisso, usuario.getEmpresaId());
        return repository.save(compromisso);
    }

    public int sincronizarRevisoesPendentes() {
        Usuario usuario = usuarioLogado();
        List<Revisao> revisoes = revisaoRepository.findByEmpresaIdAndStatusNotInAndDataPrevistaLessThanEqualOrderByDataPrevistaAsc(
                usuario.getEmpresaId(),
                List.of("CONCLUIDO", "CANCELADO"),
                LocalDate.now()
        );

        int criados = 0;
        for (Revisao revisao : revisoes) {
            if (repository.existsByEmpresaIdAndOrigemModuloAndOrigemId(usuario.getEmpresaId(), "REVISAO", revisao.getId())) {
                continue;
            }
            repository.save(montarCompromissoDaRevisao(revisao, usuario.getEmpresaId()));
            criados++;
        }
        return criados;
    }

    private CompromissoAgenda montarCompromissoDaRevisao(Revisao revisao, Long empresaId) {
        CompromissoAgenda compromisso = new CompromissoAgenda();
        compromisso.setEmpresaId(empresaId);
        compromisso.setTitulo("Retorno de revisão: " + revisao.getClienteNome());
        compromisso.setDescricao(revisao.getServico());
        compromisso.setTipo("REVISAO");
        compromisso.setSetor("COMERCIAL");
        compromisso.setPrioridade(revisao.getDataPrevista() != null && revisao.getDataPrevista().isBefore(LocalDate.now()) ? "ALTA" : "NORMAL");
        compromisso.setStatus("AGENDADO");
        compromisso.setDataInicio(revisao.getDataPrevista() != null ? revisao.getDataPrevista().atTime(9, 0) : LocalDate.now().plusDays(1).atTime(9, 0));
        compromisso.setDataFim(compromisso.getDataInicio().plusMinutes(30));
        compromisso.setParceiroId(revisao.getParceiroId());
        compromisso.setVeiculoId(revisao.getVeiculoId());
        compromisso.setOrigemModulo("REVISAO");
        compromisso.setOrigemId(revisao.getId());
        compromisso.setLembreteWhatsApp(revisao.getClienteTelefone() != null && !revisao.getClienteTelefone().isBlank());
        compromisso.setObservacaoInterna("Criado automaticamente a partir do CRM de revisões.");
        hidratarReferencias(compromisso, empresaId);
        return compromisso;
    }

    private void hidratarReferencias(CompromissoAgenda compromisso, Long empresaId) {
        if (compromisso.getParceiroId() != null) {
            parceiroRepository.findByEmpresaIdAndId(empresaId, compromisso.getParceiroId())
                    .ifPresent(parceiro -> {
                        compromisso.setParceiroNome(parceiro.getNome());
                        compromisso.setParceiroTelefone(parceiro.getTelefone());
                    });
        } else {
            compromisso.setParceiroNome(null);
            compromisso.setParceiroTelefone(null);
        }

        if (compromisso.getVeiculoId() != null) {
            veiculoRepository.findById(compromisso.getVeiculoId()).ifPresent(veiculo -> {
                compromisso.setVeiculoPlaca(veiculo.getPlaca());
                compromisso.setVeiculoDescricao(veiculo.getMarca() + " " + veiculo.getModelo());
            });
        } else {
            compromisso.setVeiculoPlaca(null);
            compromisso.setVeiculoDescricao(null);
        }

        if (compromisso.getUsuarioResponsavelId() != null) {
            usuarioRepository.findByIdAndEmpresaId(compromisso.getUsuarioResponsavelId(), empresaId)
                    .map(Usuario::getNomeCompleto)
                    .ifPresent(compromisso::setUsuarioResponsavelNome);
        } else {
            compromisso.setUsuarioResponsavelNome(null);
        }
    }

    private int calcularPesoCriticidade(CompromissoAgenda item, LocalDate dataBase) {
        int peso = 0;

        if (!"CONCLUIDO".equalsIgnoreCase(item.getStatus()) && !"CANCELADO".equalsIgnoreCase(item.getStatus())) {
            if (item.getDataInicio().toLocalDate().isBefore(dataBase)) {
                peso += 1000;
            } else if (item.getDataInicio().toLocalDate().isEqual(dataBase)) {
                peso += 200;
            }
        }

        if ("ALTA".equalsIgnoreCase(item.getPrioridade())) {
            peso += 120;
        } else if ("NORMAL".equalsIgnoreCase(item.getPrioridade())) {
            peso += 40;
        }

        if ("REVISAO".equalsIgnoreCase(item.getOrigemModulo()) || "VENDA".equalsIgnoreCase(item.getOrigemModulo())) {
            peso += 20;
        }

        if (item.getParceiroId() != null) {
            peso += parceiroRepository.findByEmpresaIdAndId(usuarioLogado().getEmpresaId(), item.getParceiroId())
                    .map(parceiro -> parceiro.getLimiteCredito() != null ? parceiro.getLimiteCredito().intValue() / 500 : 0)
                    .orElse(0);
        }

        return peso;
    }

    private LocalDateTime calcularInicioBusca(LocalDate data) {
        if (!LocalDate.now().isEqual(data)) {
            return data.atTime(8, 0);
        }

        LocalDateTime agora = LocalDateTime.now().plusMinutes(15).truncatedTo(ChronoUnit.MINUTES);
        int minuto = agora.getMinute();
        int ajuste = minuto == 0 ? 0 : (30 - (minuto % 30)) % 30;
        LocalDateTime alinhado = agora.plusMinutes(ajuste);
        LocalDateTime inicioMinimo = data.atTime(8, 0);
        return alinhado.isAfter(inicioMinimo) ? alinhado : inicioMinimo;
    }

    private boolean estaNoHorarioDeAlmoco(LocalDateTime cursor, int duracaoMinutos) {
        LocalDateTime inicioAlmoco = cursor.toLocalDate().atTime(12, 0);
        LocalDateTime fimAlmoco = cursor.toLocalDate().atTime(13, 0);
        LocalDateTime fim = cursor.plusMinutes(duracaoMinutos);
        return cursor.isBefore(fimAlmoco) && fim.isAfter(inicioAlmoco);
    }

    private String montarLabelSugestao(LocalDate data, LocalDateTime inicio, LocalDateTime fim, int indice) {
        String prefixo;
        if (LocalDate.now().isEqual(data) && indice == 0) {
            prefixo = "Melhor encaixe";
        } else if (indice == 0) {
            prefixo = "Primeira janela";
        } else if (indice == 1) {
            prefixo = "Janela livre";
        } else {
            prefixo = "Alternativa";
        }
        return prefixo + " • " + inicio.format(HORA_FORMATTER) + " - " + fim.format(HORA_FORMATTER);
    }

    private Usuario usuarioLogado() {
        return (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
