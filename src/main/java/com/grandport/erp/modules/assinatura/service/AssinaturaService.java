package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.assinatura.dto.NovaEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.ConviteAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.ConvitePublicoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaAssinaturaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaCobrancaComposicaoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaTimelineEventoDTO;
import com.grandport.erp.modules.assinatura.dto.RegistrarPagamentoDTO;
import com.grandport.erp.modules.assinatura.dto.SaasOperacaoResumoDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarPlanoEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.dto.ModuloLicencaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.LiberacaoManualCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.PlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.dto.ProrrogarCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.SalvarPlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoResumoDTO;
import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.model.SecurityEvent;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.admin.repository.SecurityEventRepository;
import com.grandport.erp.modules.assinatura.model.AssinaturaInvite;
import com.grandport.erp.modules.assinatura.model.EmpresaCadastroComplementar;
import com.grandport.erp.modules.assinatura.model.SolicitacaoAcesso;
import com.grandport.erp.modules.assinatura.repository.AssinaturaInviteRepository;
import com.grandport.erp.modules.assinatura.repository.EmpresaCadastroComplementarRepository;
import com.grandport.erp.modules.assinatura.repository.SolicitacaoAcessoRepository;
import com.grandport.erp.modules.empresa.model.Empresa;
import com.grandport.erp.modules.empresa.model.StatusAssinatura;
import com.grandport.erp.modules.empresa.repository.EmpresaRepository;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssinaturaService {

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;
    private final AssinaturaInviteRepository assinaturaInviteRepository;
    private final SolicitacaoAcessoRepository solicitacaoAcessoRepository;
    private final CobrancaAssinaturaService cobrancaAssinaturaService;
    private final LicenciamentoModuloService licenciamentoModuloService;
    private final IncidenteEmpresaService incidenteEmpresaService;
    private final EmpresaCadastroComplementarRepository empresaCadastroComplementarRepository;
    private final PlataformaAvisoOperacionalService plataformaAvisoOperacionalService;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final SecurityEventRepository securityEventRepository;

    public AssinaturaService(EmpresaRepository empresaRepository, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, PasswordPolicyService passwordPolicyService, AssinaturaInviteRepository assinaturaInviteRepository, SolicitacaoAcessoRepository solicitacaoAcessoRepository, CobrancaAssinaturaService cobrancaAssinaturaService, LicenciamentoModuloService licenciamentoModuloService, IncidenteEmpresaService incidenteEmpresaService, EmpresaCadastroComplementarRepository empresaCadastroComplementarRepository, PlataformaAvisoOperacionalService plataformaAvisoOperacionalService, LogAuditoriaRepository logAuditoriaRepository, SecurityEventRepository securityEventRepository) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
        this.assinaturaInviteRepository = assinaturaInviteRepository;
        this.solicitacaoAcessoRepository = solicitacaoAcessoRepository;
        this.cobrancaAssinaturaService = cobrancaAssinaturaService;
        this.licenciamentoModuloService = licenciamentoModuloService;
        this.incidenteEmpresaService = incidenteEmpresaService;
        this.empresaCadastroComplementarRepository = empresaCadastroComplementarRepository;
        this.plataformaAvisoOperacionalService = plataformaAvisoOperacionalService;
        this.logAuditoriaRepository = logAuditoriaRepository;
        this.securityEventRepository = securityEventRepository;
    }

    @Transactional
    public Empresa registarNovaEmpresa(NovaEmpresaDTO dto) {
        AssinaturaInvite invite = validarConvite(dto.inviteToken(), dto.emailAdmin());

        // 1. Validação Tática
        if (empresaRepository.existsByCnpj(dto.cnpj())) {
            throw new RuntimeException("Operação Negada: Já existe uma empresa registrada com este CNPJ.");
        }

        // 🚀 Verificação direta para nulo (sem o isPresent)
        if (usuarioRepository.findByUsername(dto.emailAdmin()) != null) {
            throw new RuntimeException("Operação Negada: Este login/e-mail já está em uso por outro usuário.");
        }
        passwordPolicyService.validateOrThrow(dto.senhaAdmin());

        // 2. Cria o Quartel-General (A Empresa)
        Empresa empresa = new Empresa();
        empresa.setRazaoSocial(dto.razaoSocial());
        empresa.setCnpj(dto.cnpj());
        empresa.setEmailContato(dto.emailAdmin());
        empresa.setTelefone(dto.telefone());
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setDataVencimento(LocalDate.now().plusDays(30));
        empresa.setMotivoBloqueio(null);
        empresa.setPlano("ESSENCIAL");
        empresa.setValorMensal(BigDecimal.ZERO);
        empresa.setDiasTolerancia(0);

        Empresa empresaSalva = empresaRepository.save(empresa);

        // 3. Cria o General (O Usuário Admin da nova empresa)
        Usuario admin = new Usuario();

        admin.setNomeCompleto(dto.nomeAdmin());
        admin.setUsername(dto.emailAdmin()); // Onde vai ficar salvo o e-mail de login
        admin.setSenha(passwordEncoder.encode(dto.senhaAdmin()));
        admin.setForcePasswordChange(true);
        admin.setTipoAcesso(TipoAcesso.TENANT_ADMIN);

        // O motor do SaaS ativado
        admin.setEmpresaId(empresaSalva.getId());

        // 🚀 O ARSENAL COMPLETO: Dá o crachá de acesso total absoluto ao dono da nova empresa!
        admin.setPermissoes(java.util.Arrays.asList(
                "dash", "pdv", "vendas", "orcamentos", "fila-caixa", "caixa", "relatorio-comissoes",
                "estoque", "marcas", "ajuste_estoque", "compras", "previsao", "faltas",
                "contas-pagar", "contas-receber", "bancos", "conciliacao", "plano-contas", "dre",
                "parceiros", "usuarios", "auditoria", "fiscal", "configuracoes", "calculadora", "recibo-avulso","historico-recibos","ncm", "whatsapp",
                "backup","regras-fiscais","categorias","gerenciador-nfe","emitir-nfe-avulsa","manual","revisoes","crm","etiquetas",
                "os","servicos","listagem-os","checklist","curva-abc","fluxo-caixa-projecao"
        ));

        usuarioRepository.save(admin);
        empresaCadastroComplementarRepository.save(criarCadastroComplementarInicial(empresaSalva.getId()));
        invite.setAtivo(false);
        invite.setUsedAt(LocalDateTime.now());
        assinaturaInviteRepository.save(invite);

        return empresaSalva;
    }

    @Transactional
    public void solicitarAcesso(SolicitacaoAcessoDTO dto) {
        if (solicitacaoAcessoRepository.existsByCnpjAndStatusIn(dto.cnpj(), List.of("PENDENTE", "APROVADA"))) {
            throw new RuntimeException("Já existe uma solicitação ativa para este CNPJ.");
        }

        SolicitacaoAcesso solicitacao = new SolicitacaoAcesso();
        solicitacao.setRazaoSocial(dto.razaoSocial());
        solicitacao.setCnpj(dto.cnpj());
        solicitacao.setTelefone(dto.telefone());
        solicitacao.setNomeContato(dto.nomeContato());
        solicitacao.setEmailContato(dto.emailContato());
        solicitacao.setObservacoes(dto.observacoes());
        solicitacao.setStatus("PENDENTE");
        solicitacao.setCreatedAt(LocalDateTime.now());
        solicitacaoAcessoRepository.save(solicitacao);
    }

    @Transactional
    public ConviteAssinaturaDTO gerarConvite(String emailDestino) {
        AssinaturaInvite invite = new AssinaturaInvite();
        invite.setEmailDestino(emailDestino);
        invite.setToken(UUID.randomUUID().toString().replace("-", ""));
        invite.setCreatedAt(LocalDateTime.now());
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));
        invite.setCreatedBy(usuarioAtual());
        assinaturaInviteRepository.save(invite);
        return toDto(invite);
    }

    public void validarAcessoPlataforma() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new RuntimeException("Acesso de plataforma não autenticado.");
        }
        if (usuario.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Apenas administradores da plataforma podem gerenciar solicitações e convites.");
        }
    }

    @Transactional(readOnly = true)
    public PlataformaAvisoOperacionalDTO obterAvisoManutencaoPlataforma() {
        return plataformaAvisoOperacionalService.obterAvisoManutencao();
    }

    @Transactional
    public PlataformaAvisoOperacionalDTO salvarAvisoManutencaoPlataforma(SalvarPlataformaAvisoOperacionalDTO dto) {
        validarAcessoPlataforma();
        return plataformaAvisoOperacionalService.salvarAvisoManutencao(dto, usuarioAtual());
    }

    @Transactional(readOnly = true)
    public List<ConviteAssinaturaDTO> listarConvites() {
        return assinaturaInviteRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConvitePublicoDTO consultarConvitePublico(String token) {
        AssinaturaInvite invite = assinaturaInviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Convite não encontrado."));

        String status;
        String statusMessage;
        if (invite.getUsedAt() != null) {
            status = "USADO";
            statusMessage = "Este convite já foi utilizado em " + invite.getUsedAt() + ".";
        } else if (!invite.isAtivo()) {
            status = "INATIVO";
            statusMessage = "Este convite foi desativado e não pode mais ser utilizado.";
        } else if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            status = "EXPIRADO";
            statusMessage = "Este convite expirou em " + invite.getExpiresAt() + ".";
        } else {
            status = "ATIVO";
            statusMessage = "Convite válido. Você já pode finalizar o cadastro da empresa.";
        }

        return new ConvitePublicoDTO(
                invite.getEmailDestino(),
                invite.getExpiresAt().toString(),
                status,
                statusMessage,
                invite.getUsedAt() != null ? invite.getUsedAt().toString() : null
        );
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoAcessoResumoDTO> listarSolicitacoes() {
        return solicitacaoAcessoRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmpresaAssinaturaResumoDTO> listarEmpresas() {
        return empresaRepository.findAll().stream()
                .sorted((a, b) -> b.getDataCadastro().compareTo(a.getDataCadastro()))
                .map(this::toEmpresaDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SaasOperacaoResumoDTO obterResumoOperacao() {
        List<Empresa> empresas = empresaRepository.findAll();
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(7);
        double mrrBase = empresas.stream()
                .map(Empresa::getValorMensal)
                .filter(valor -> valor != null)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
        int empresasVencendo7Dias = (int) empresas.stream()
                .filter(item -> item.getDataVencimento() != null)
                .filter(item -> !item.getDataVencimento().isBefore(hoje) && !item.getDataVencimento().isAfter(limite))
                .count();
        int empresasComBloqueioComercial = (int) empresas.stream()
                .filter(item -> licenciamentoModuloService.listarLicencasEmpresa(item.getId()).stream().anyMatch(ModuloLicencaResumoDTO::bloqueadoComercial))
                .count();

        return new SaasOperacaoResumoDTO(
                empresas.size(),
                (int) empresas.stream().filter(item -> item.getStatusAssinatura() == StatusAssinatura.ATIVA).count(),
                (int) empresas.stream().filter(item -> item.getStatusAssinatura() == StatusAssinatura.INADIMPLENTE).count(),
                (int) empresas.stream().filter(item -> item.getStatusAssinatura() == StatusAssinatura.BLOQUEADA).count(),
                empresasVencendo7Dias,
                mrrBase,
                licenciamentoModuloService.somarReceitaExtrasMensal().doubleValue(),
                (int) licenciamentoModuloService.totalModulosExtrasAtivos(),
                (int) licenciamentoModuloService.totalTrialsAtivos(),
                empresasComBloqueioComercial,
                (int) licenciamentoModuloService.totalModulosBloqueadosComercialmente(),
                (int) incidenteEmpresaService.totalIncidentesAbertos(),
                (int) incidenteEmpresaService.totalSlaVencido()
        );
    }

    @Transactional(readOnly = true)
    public List<EmpresaTimelineEventoDTO> listarTimelineEmpresa(Long empresaId) {
        empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));

        List<EmpresaTimelineEventoDTO> eventos = new ArrayList<>();

        for (LogAuditoria logItem : logAuditoriaRepository.findTop20ByEmpresaIdOrderByDataHoraDesc(empresaId)) {
            eventos.add(new EmpresaTimelineEventoDTO(
                    logItem.getDataHora() == null ? null : logItem.getDataHora().toString(),
                    "AUDITORIA",
                    logItem.getAcao(),
                    logItem.getDetalhes(),
                    "INFO",
                    logItem.getModulo()
            ));
        }

        for (SecurityEvent event : securityEventRepository.findTop20ByEmpresaIdOrderByDataHoraDesc(empresaId)) {
            eventos.add(new EmpresaTimelineEventoDTO(
                    event.getDataHora() == null ? null : event.getDataHora().toString(),
                    "SEGURANCA",
                    event.getTipo(),
                    event.getDetalhes(),
                    event.getSeveridade(),
                    "SECURITY_EVENT"
            ));
        }

        for (AssinaturaCobranca cobranca : cobrancaAssinaturaService.listarEntidadesPorEmpresa(empresaId)) {
            eventos.add(new EmpresaTimelineEventoDTO(
                    cobranca.getCreatedAt() == null ? null : cobranca.getCreatedAt().toString(),
                    "COBRANCA",
                    "COBRANCA_" + cobranca.getStatus().name(),
                    "Cobrança " + cobranca.getReferencia() + " no valor de R$ " + cobranca.getValor(),
                    cobranca.getStatus().name(),
                    "BILLING"
            ));
        }

        for (EmpresaIncidenteDTO incidente : incidenteEmpresaService.listarPorEmpresa(empresaId)) {
            String prazo = incidente.prazoResolucao() != null
                    ? " · SLA resolução: " + incidente.prazoResolucao()
                    : incidente.prazoResposta() != null ? " · SLA resposta: " + incidente.prazoResposta() : "";
            String descricao = incidente.descricao() == null || incidente.descricao().isBlank()
                    ? "Incidente sem descrição operacional." + prazo
                    : incidente.descricao() + prazo;
            eventos.add(new EmpresaTimelineEventoDTO(
                    incidente.updatedAt() != null ? incidente.updatedAt() : incidente.createdAt(),
                    "INCIDENTE",
                    incidente.status() + " · " + incidente.titulo(),
                    descricao,
                    incidente.severidade(),
                    "INCIDENTES"
            ));
        }

        return eventos.stream()
                .sorted(Comparator.comparing(EmpresaTimelineEventoDTO::dataHora, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(25)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO bloquearEmpresa(Long empresaId, String motivoBloqueio) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        String motivo = motivoBloqueio == null || motivoBloqueio.isBlank()
                ? "Bloqueio manual pela plataforma."
                : motivoBloqueio.trim();
        empresa.setStatusAssinatura(StatusAssinatura.BLOQUEADA);
        empresa.setMotivoBloqueio(motivo);
        registrarAuditoriaEmpresa(empresaId, "ASSINATURA_BLOQUEADA", "Empresa bloqueada pela plataforma. Motivo: " + motivo);
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO cancelarEmpresa(Long empresaId, String motivoBloqueio) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        String motivo = motivoBloqueio == null || motivoBloqueio.isBlank()
                ? "Desligamento da plataforma."
                : motivoBloqueio.trim();
        empresa.setAtivo(false);
        empresa.setStatusAssinatura(StatusAssinatura.CANCELADA);
        empresa.setDataDesligamento(LocalDateTime.now());
        empresa.setMotivoBloqueio(motivo);
        registrarAuditoriaEmpresa(empresaId, "ASSINATURA_CANCELADA", "Empresa desligada da plataforma. Motivo: " + motivo);
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO registrarPagamento(Long empresaId, RegistrarPagamentoDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        if (dto == null || dto.novaDataVencimento() == null || dto.novaDataVencimento().isBlank()) {
            throw new RuntimeException("Informe a nova data de vencimento para registrar o pagamento.");
        }

        empresa.setAtivo(true);
        empresa.setDataDesligamento(null);
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setMotivoBloqueio(null);
        LocalDate novoVencimento = LocalDate.parse(dto.novaDataVencimento());
        empresa.setDataVencimento(novoVencimento);
        cobrancaAssinaturaService.registrarPagamentoManual(empresaId, novoVencimento);
        registrarAuditoriaEmpresa(empresaId, "ASSINATURA_PAGAMENTO_MANUAL", "Pagamento manual registrado. Novo vencimento: " + novoVencimento + ".");
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO reativarEmpresa(Long empresaId, RegistrarPagamentoDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        empresa.setAtivo(true);
        empresa.setDataDesligamento(null);
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setMotivoBloqueio(null);
        if (dto != null && dto.novaDataVencimento() != null && !dto.novaDataVencimento().isBlank()) {
            empresa.setDataVencimento(LocalDate.parse(dto.novaDataVencimento()));
        } else if (empresa.getDataVencimento() == null || empresa.getDataVencimento().isBefore(LocalDate.now())) {
            empresa.setDataVencimento(LocalDate.now().plusDays(30));
        }
        cobrancaAssinaturaService.registrarPagamentoManual(empresaId, empresa.getDataVencimento());
        registrarAuditoriaEmpresa(empresaId, "ASSINATURA_REATIVADA", "Empresa reativada pela plataforma. Novo vencimento: " + empresa.getDataVencimento() + ".");
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO atualizarPlanoEmpresa(Long empresaId, AtualizarPlanoEmpresaDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        if (dto == null) {
            throw new RuntimeException("Dados do plano não informados.");
        }
        if (dto.plano() == null || dto.plano().isBlank()) {
            throw new RuntimeException("Informe o nome do plano.");
        }

        String codigoPlano = dto.plano().trim().toUpperCase();
        boolean planoExiste = licenciamentoModuloService.listarPlanos().stream()
                .anyMatch(plano -> codigoPlano.equalsIgnoreCase(plano.codigo()) && Boolean.TRUE.equals(plano.ativo()));
        if (!planoExiste) {
            throw new RuntimeException("Plano não encontrado ou inativo: " + codigoPlano + ".");
        }

        empresa.setPlano(codigoPlano);
        empresa.setValorMensal(BigDecimal.valueOf(dto.valorMensal() == null ? 0D : dto.valorMensal()));
        empresa.setDiasTolerancia(dto.diasTolerancia() == null ? 0 : Math.max(dto.diasTolerancia(), 0));
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public ConviteAssinaturaDTO aprovarSolicitacao(Long solicitacaoId) {
        SolicitacaoAcesso solicitacao = solicitacaoAcessoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        if ("APROVADA".equalsIgnoreCase(solicitacao.getStatus())) {
            throw new RuntimeException("Esta solicitação já foi aprovada.");
        }

        ConviteAssinaturaDTO convite = gerarConvite(solicitacao.getEmailContato());
        solicitacao.setStatus("APROVADA");
        solicitacaoAcessoRepository.save(solicitacao);
        return convite;
    }

    private AssinaturaInvite validarConvite(String token, String emailAdmin) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Convite obrigatório para criar uma nova conta.");
        }

        AssinaturaInvite invite = assinaturaInviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Convite inválido."));

        if (!invite.isAtivo() || invite.getUsedAt() != null) {
            throw new RuntimeException("Este convite já foi utilizado ou está inativo.");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Este convite expirou.");
        }
        if (!invite.getEmailDestino().equalsIgnoreCase(emailAdmin)) {
            throw new RuntimeException("O convite foi emitido para outro e-mail.");
        }
        return invite;
    }

    private ConviteAssinaturaDTO toDto(AssinaturaInvite invite) {
        String status = invite.getUsedAt() != null ? "USADO" : (invite.isAtivo() ? "ATIVO" : "INATIVO");
        return new ConviteAssinaturaDTO(
                invite.getId(),
                invite.getEmailDestino(),
                invite.getToken(),
                status,
                invite.getExpiresAt().toString()
        );
    }

    private SolicitacaoAcessoResumoDTO toDto(SolicitacaoAcesso solicitacao) {
        return new SolicitacaoAcessoResumoDTO(
                solicitacao.getId(),
                solicitacao.getRazaoSocial(),
                solicitacao.getCnpj(),
                solicitacao.getTelefone(),
                solicitacao.getNomeContato(),
                solicitacao.getEmailContato(),
                solicitacao.getObservacoes(),
                solicitacao.getStatus(),
                solicitacao.getCreatedAt() == null ? null : solicitacao.getCreatedAt().toString()
        );
    }

    private EmpresaAssinaturaResumoDTO toEmpresaDto(Empresa empresa) {
        String adminPrincipal = usuarioRepository.findFirstByEmpresaIdAndTipoAcessoOrderByIdAsc(empresa.getId(), TipoAcesso.TENANT_ADMIN)
                .map(Usuario::getUsername)
                .orElse(empresa.getEmailContato());
        AssinaturaCobranca ultimaCobranca = cobrancaAssinaturaService.obterUltimaCobranca(empresa.getId());
        List<ModuloLicencaResumoDTO> licencas = licenciamentoModuloService.listarLicencasEmpresa(empresa.getId());
        int totalModulosAtivos = (int) licencas.stream().filter(ModuloLicencaResumoDTO::ativo).count();
        int totalModulosExtras = (int) licencas.stream().filter(item -> item.ativo() && !item.disponivelNoPlano()).count();
        int totalModulosBloqueados = (int) licencas.stream().filter(item -> !item.ativo()).count();
        int totalModulosBloqueadosComercialmente = (int) licencas.stream().filter(ModuloLicencaResumoDTO::bloqueadoComercial).count();
        EmpresaCobrancaComposicaoDTO composicao = licenciamentoModuloService.montarComposicaoCobrancaEmpresa(empresa);
        EmpresaCadastroComplementarDTO cadastroComplementar = toCadastroComplementarDto(empresa, obterCadastroComplementarOuPadrao(empresa.getId()));
        boolean empresaInterna = licenciamentoModuloService.empresaInterna(empresa.getId());

        return new EmpresaAssinaturaResumoDTO(
                empresa.getId(),
                empresa.getRazaoSocial(),
                empresa.getCnpj(),
                empresa.getEmailContato(),
                empresa.getTelefone(),
                empresa.getDataCadastro() == null ? null : empresa.getDataCadastro().toString(),
                empresa.getDataDesligamento() == null ? null : empresa.getDataDesligamento().toString(),
                empresa.getAtivo(),
                empresa.getStatusAssinatura() == null ? null : empresa.getStatusAssinatura().name(),
                empresa.getDataVencimento() == null ? null : empresa.getDataVencimento().toString(),
                empresa.getMotivoBloqueio(),
                adminPrincipal,
                empresaInterna,
                empresa.getPlano(),
                empresa.getValorMensal() == null ? 0D : empresa.getValorMensal().doubleValue(),
                empresa.getDiasTolerancia(),
                totalModulosAtivos,
                totalModulosExtras,
                totalModulosBloqueados,
                totalModulosBloqueadosComercialmente,
                composicao.valorExtras(),
                composicao.valorTotalPrevisto(),
                composicao.extrasCobrados(),
                cadastroComplementar.statusOnboarding(),
                cadastroComplementar.prazoConclusao(),
                cadastroComplementar.liberacaoManualAtiva(),
                cadastroComplementar.liberacaoManualPor(),
                cadastroComplementar.liberacaoManualEm(),
                cadastroComplementar.percentualPreenchimento(),
                cadastroComplementar.diasRestantes(),
                cadastroComplementar.pendencias(),
                ultimaCobranca == null || ultimaCobranca.getStatus() == null ? null : ultimaCobranca.getStatus().name(),
                ultimaCobranca == null || ultimaCobranca.getDataVencimento() == null ? null : ultimaCobranca.getDataVencimento().toString(),
                ultimaCobranca == null || ultimaCobranca.getValor() == null ? null : ultimaCobranca.getValor().doubleValue(),
                ultimaCobranca == null ? null : ultimaCobranca.getPaymentLink()
        );
    }

    @Transactional(readOnly = true)
    public EmpresaCadastroComplementarDTO obterCadastroComplementarEmpresa(Long empresaId) {
        validarAcessoPlataforma();
        Empresa empresa = empresaRepository.findById(empresaId).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        return toCadastroComplementarDto(empresa, obterCadastroComplementarOuPadrao(empresaId));
    }

    @Transactional
    public EmpresaCadastroComplementarDTO atualizarCadastroComplementarEmpresa(Long empresaId, AtualizarCadastroComplementarDTO dto) {
        validarAcessoPlataforma();
        Empresa empresa = empresaRepository.findById(empresaId).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        EmpresaCadastroComplementar cadastro = aplicarCadastroComplementar(obterOuCriarCadastroComplementarPersistido(empresaId), dto);
        return toCadastroComplementarDto(empresa, empresaCadastroComplementarRepository.save(cadastro));
    }

    @Transactional
    public EmpresaCadastroComplementarDTO prorrogarCadastroComplementarEmpresa(Long empresaId, ProrrogarCadastroComplementarDTO dto) {
        validarAcessoPlataforma();
        Empresa empresa = empresaRepository.findById(empresaId).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        EmpresaCadastroComplementar cadastro = obterOuCriarCadastroComplementarPersistido(empresaId);
        int dias = dto == null || dto.dias() == null || dto.dias() <= 0 ? 7 : dto.dias();
        LocalDate base = cadastro.getPrazoConclusao() == null ? LocalDate.now() : cadastro.getPrazoConclusao();
        cadastro.setPrazoConclusao(base.plusDays(dias));
        cadastro.setUpdatedAt(LocalDateTime.now());
        if (!cadastroCompleto(cadastro)) {
            cadastro.setStatusOnboarding("PENDENTE_COMPLEMENTO");
        }
        return toCadastroComplementarDto(empresa, empresaCadastroComplementarRepository.save(cadastro));
    }

    @Transactional
    public EmpresaCadastroComplementarDTO atualizarLiberacaoManualCadastroComplementarEmpresa(Long empresaId, LiberacaoManualCadastroComplementarDTO dto) {
        validarAcessoPlataforma();
        Empresa empresa = empresaRepository.findById(empresaId).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        EmpresaCadastroComplementar cadastro = obterOuCriarCadastroComplementarPersistido(empresaId);
        boolean liberar = dto != null && Boolean.TRUE.equals(dto.liberar());
        String motivo = liberar ? textoNormalizado(dto.motivo()) : null;

        cadastro.setLiberacaoManualAtiva(liberar);
        cadastro.setLiberacaoManualMotivo(motivo);
        cadastro.setLiberacaoManualPor(liberar ? usuarioAtual() : null);
        cadastro.setLiberacaoManualEm(liberar ? LocalDateTime.now() : null);
        cadastro.setUpdatedAt(LocalDateTime.now());

        registrarAuditoriaOnboarding(
                empresaId,
                liberar ? "ONBOARDING_LIBERACAO_MANUAL_ATIVADA" : "ONBOARDING_LIBERACAO_MANUAL_REMOVIDA",
                liberar
                        ? "Liberação manual do onboarding ativada para " + empresa.getRazaoSocial()
                        + (motivo == null ? "." : " Motivo: " + motivo)
                        : "Liberação manual do onboarding removida para " + empresa.getRazaoSocial() + "."
        );

        return toCadastroComplementarDto(empresa, empresaCadastroComplementarRepository.save(cadastro));
    }

    @Transactional(readOnly = true)
    public EmpresaCadastroComplementarDTO obterMeuCadastroComplementar() {
        Usuario usuario = usuarioAutenticado();
        Empresa empresa = empresaRepository.findById(usuario.getEmpresaId()).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        return toCadastroComplementarDto(empresa, obterCadastroComplementarOuPadrao(usuario.getEmpresaId()));
    }

    @Transactional
    public EmpresaCadastroComplementarDTO atualizarMeuCadastroComplementar(AtualizarCadastroComplementarDTO dto) {
        Usuario usuario = usuarioAutenticado();
        Empresa empresa = empresaRepository.findById(usuario.getEmpresaId()).orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        EmpresaCadastroComplementar cadastro = aplicarCadastroComplementar(obterOuCriarCadastroComplementarPersistido(usuario.getEmpresaId()), dto);
        return toCadastroComplementarDto(empresa, empresaCadastroComplementarRepository.save(cadastro));
    }

    public String usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SISTEMA";
        }
        return authentication.getName();
    }

    public Long empresaIdUsuarioAtual() {
        return usuarioAutenticado().getEmpresaId();
    }

    private Usuario usuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            throw new RuntimeException("Usuário autenticado não encontrado.");
        }
        return usuario;
    }

    private EmpresaCadastroComplementar criarCadastroComplementarInicial(Long empresaId) {
        EmpresaCadastroComplementar cadastro = new EmpresaCadastroComplementar();
        cadastro.setEmpresaId(empresaId);
        cadastro.setPrazoConclusao(LocalDate.now().plusDays(7));
        cadastro.setStatusOnboarding("PENDENTE_COMPLEMENTO");
        cadastro.setCreatedAt(LocalDateTime.now());
        cadastro.setUpdatedAt(LocalDateTime.now());
        return cadastro;
    }

    private EmpresaCadastroComplementar obterCadastroComplementarOuPadrao(Long empresaId) {
        return empresaCadastroComplementarRepository.findByEmpresaId(empresaId)
                .orElseGet(() -> criarCadastroComplementarInicial(empresaId));
    }

    private EmpresaCadastroComplementar obterOuCriarCadastroComplementarPersistido(Long empresaId) {
        return empresaCadastroComplementarRepository.findByEmpresaId(empresaId)
                .orElseGet(() -> empresaCadastroComplementarRepository.save(criarCadastroComplementarInicial(empresaId)));
    }

    private EmpresaCadastroComplementar aplicarCadastroComplementar(EmpresaCadastroComplementar cadastro, AtualizarCadastroComplementarDTO dto) {
        cadastro.setNomeFantasia(textoNormalizado(dto.nomeFantasia()));
        cadastro.setInscricaoEstadual(textoNormalizado(dto.inscricaoEstadual()));
        cadastro.setInscricaoMunicipal(textoNormalizado(dto.inscricaoMunicipal()));
        cadastro.setRegimeTributario(textoNormalizado(dto.regimeTributario()));
        cadastro.setWebsite(textoNormalizado(dto.website()));
        cadastro.setCep(textoNormalizado(dto.cep()));
        cadastro.setLogradouro(textoNormalizado(dto.logradouro()));
        cadastro.setNumero(textoNormalizado(dto.numero()));
        cadastro.setComplemento(textoNormalizado(dto.complemento()));
        cadastro.setBairro(textoNormalizado(dto.bairro()));
        cadastro.setCidade(textoNormalizado(dto.cidade()));
        cadastro.setUf(textoNormalizado(dto.uf()));
        cadastro.setResponsavelFinanceiroNome(textoNormalizado(dto.responsavelFinanceiroNome()));
        cadastro.setResponsavelFinanceiroEmail(textoNormalizado(dto.responsavelFinanceiroEmail()));
        cadastro.setResponsavelFinanceiroTelefone(textoNormalizado(dto.responsavelFinanceiroTelefone()));
        cadastro.setResponsavelOperacionalNome(textoNormalizado(dto.responsavelOperacionalNome()));
        cadastro.setResponsavelOperacionalEmail(textoNormalizado(dto.responsavelOperacionalEmail()));
        cadastro.setResponsavelOperacionalTelefone(textoNormalizado(dto.responsavelOperacionalTelefone()));
        cadastro.setObservacoes(textoNormalizado(dto.observacoes()));
        cadastro.setAceiteLgpd(Boolean.TRUE.equals(dto.aceiteLgpd()));
        cadastro.setUpdatedAt(LocalDateTime.now());
        atualizarStatusCadastro(cadastro);
        return cadastro;
    }

    private void atualizarStatusCadastro(EmpresaCadastroComplementar cadastro) {
        if (cadastroCompleto(cadastro)) {
            cadastro.setStatusOnboarding("COMPLETO");
            if (cadastro.getConcluidoEm() == null) {
                cadastro.setConcluidoEm(LocalDateTime.now());
            }
            return;
        }

        cadastro.setConcluidoEm(null);
        boolean temConteudo = percentualCadastro(cadastro) > 0;
        if (cadastro.getPrazoConclusao() != null && cadastro.getPrazoConclusao().isBefore(LocalDate.now())) {
            cadastro.setStatusOnboarding("VENCIDO");
        } else if (temConteudo) {
            cadastro.setStatusOnboarding("EM_PREENCHIMENTO");
        } else {
            cadastro.setStatusOnboarding("PENDENTE_COMPLEMENTO");
        }
    }

    private EmpresaCadastroComplementarDTO toCadastroComplementarDto(Empresa empresa, EmpresaCadastroComplementar cadastro) {
        atualizarStatusCadastro(cadastro);
        List<String> pendencias = pendenciasCadastro(cadastro);
        LocalDate hoje = LocalDate.now();
        Integer diasRestantes = cadastro.getPrazoConclusao() == null ? null : (int) java.time.temporal.ChronoUnit.DAYS.between(hoje, cadastro.getPrazoConclusao());
        return new EmpresaCadastroComplementarDTO(
                cadastro.getEmpresaId(),
                empresa == null ? null : empresa.getRazaoSocial(),
                empresa == null ? null : empresa.getCnpj(),
                empresa == null ? null : empresa.getEmailContato(),
                empresa == null ? null : empresa.getTelefone(),
                cadastro.getStatusOnboarding(),
                cadastro.getPrazoConclusao() == null ? null : cadastro.getPrazoConclusao().toString(),
                cadastro.getConcluidoEm() == null ? null : cadastro.getConcluidoEm().toString(),
                cadastro.isLiberacaoManualAtiva(),
                cadastro.getLiberacaoManualEm() == null ? null : cadastro.getLiberacaoManualEm().toString(),
                cadastro.getLiberacaoManualPor(),
                cadastro.getLiberacaoManualMotivo(),
                percentualCadastro(cadastro),
                diasRestantes,
                pendencias,
                cadastro.getNomeFantasia(),
                cadastro.getInscricaoEstadual(),
                cadastro.getInscricaoMunicipal(),
                cadastro.getRegimeTributario(),
                cadastro.getWebsite(),
                cadastro.getCep(),
                cadastro.getLogradouro(),
                cadastro.getNumero(),
                cadastro.getComplemento(),
                cadastro.getBairro(),
                cadastro.getCidade(),
                cadastro.getUf(),
                cadastro.getResponsavelFinanceiroNome(),
                cadastro.getResponsavelFinanceiroEmail(),
                cadastro.getResponsavelFinanceiroTelefone(),
                cadastro.getResponsavelOperacionalNome(),
                cadastro.getResponsavelOperacionalEmail(),
                cadastro.getResponsavelOperacionalTelefone(),
                cadastro.isAceiteLgpd(),
                cadastro.getObservacoes()
        );
    }

    private int percentualCadastro(EmpresaCadastroComplementar cadastro) {
        int total = 11;
        int preenchidos = 0;
        if (textoNormalizado(cadastro.getNomeFantasia()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getRegimeTributario()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getCep()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getLogradouro()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getNumero()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getBairro()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getCidade()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getUf()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getResponsavelFinanceiroNome()) != null) preenchidos++;
        if (textoNormalizado(cadastro.getResponsavelFinanceiroEmail()) != null) preenchidos++;
        if (cadastro.isAceiteLgpd()) preenchidos++;
        return (int) Math.round((preenchidos * 100D) / total);
    }

    private boolean cadastroCompleto(EmpresaCadastroComplementar cadastro) {
        return pendenciasCadastro(cadastro).isEmpty();
    }

    private List<String> pendenciasCadastro(EmpresaCadastroComplementar cadastro) {
        List<String> pendencias = new ArrayList<>();
        if (textoNormalizado(cadastro.getNomeFantasia()) == null) pendencias.add("Nome fantasia");
        if (textoNormalizado(cadastro.getRegimeTributario()) == null) pendencias.add("Regime tributário");
        if (textoNormalizado(cadastro.getCep()) == null || textoNormalizado(cadastro.getLogradouro()) == null
                || textoNormalizado(cadastro.getNumero()) == null || textoNormalizado(cadastro.getBairro()) == null
                || textoNormalizado(cadastro.getCidade()) == null || textoNormalizado(cadastro.getUf()) == null) {
            pendencias.add("Endereço completo");
        }
        if (textoNormalizado(cadastro.getResponsavelFinanceiroNome()) == null
                || textoNormalizado(cadastro.getResponsavelFinanceiroEmail()) == null) {
            pendencias.add("Responsável financeiro");
        }
        if (!cadastro.isAceiteLgpd()) pendencias.add("Aceite LGPD");
        return pendencias;
    }

    private String textoNormalizado(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private void registrarAuditoriaOnboarding(Long empresaId, String acao, String detalhes) {
        registrarAuditoriaEmpresa(empresaId, acao, detalhes, "ONBOARDING");
    }

    private void registrarAuditoriaEmpresa(Long empresaId, String acao, String detalhes) {
        registrarAuditoriaEmpresa(empresaId, acao, detalhes, "ASSINATURA");
    }

    private void registrarAuditoriaEmpresa(Long empresaId, String acao, String detalhes, String modulo) {
        LogAuditoria log = new LogAuditoria();
        log.setEmpresaId(empresaId);
        log.setDataHora(LocalDateTime.now());
        log.setUsuarioNome(usuarioAtual());
        log.setModulo(modulo);
        log.setAcao(acao);
        log.setDetalhes(detalhes);
        logAuditoriaRepository.save(log);
    }
}
