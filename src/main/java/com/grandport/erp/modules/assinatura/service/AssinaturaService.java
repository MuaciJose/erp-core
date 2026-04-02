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
import com.grandport.erp.modules.assinatura.model.AssinaturaCobranca;
import com.grandport.erp.modules.assinatura.dto.ModuloLicencaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoResumoDTO;
import com.grandport.erp.modules.admin.model.LogAuditoria;
import com.grandport.erp.modules.admin.model.SecurityEvent;
import com.grandport.erp.modules.admin.repository.LogAuditoriaRepository;
import com.grandport.erp.modules.admin.repository.SecurityEventRepository;
import com.grandport.erp.modules.assinatura.model.AssinaturaInvite;
import com.grandport.erp.modules.assinatura.model.SolicitacaoAcesso;
import com.grandport.erp.modules.assinatura.repository.AssinaturaInviteRepository;
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
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final SecurityEventRepository securityEventRepository;

    public AssinaturaService(EmpresaRepository empresaRepository, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, PasswordPolicyService passwordPolicyService, AssinaturaInviteRepository assinaturaInviteRepository, SolicitacaoAcessoRepository solicitacaoAcessoRepository, CobrancaAssinaturaService cobrancaAssinaturaService, LicenciamentoModuloService licenciamentoModuloService, IncidenteEmpresaService incidenteEmpresaService, LogAuditoriaRepository logAuditoriaRepository, SecurityEventRepository securityEventRepository) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
        this.assinaturaInviteRepository = assinaturaInviteRepository;
        this.solicitacaoAcessoRepository = solicitacaoAcessoRepository;
        this.cobrancaAssinaturaService = cobrancaAssinaturaService;
        this.licenciamentoModuloService = licenciamentoModuloService;
        this.incidenteEmpresaService = incidenteEmpresaService;
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
        empresa.setStatusAssinatura(StatusAssinatura.BLOQUEADA);
        empresa.setMotivoBloqueio(motivoBloqueio == null || motivoBloqueio.isBlank()
                ? "Bloqueio manual pela plataforma."
                : motivoBloqueio.trim());
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO registrarPagamento(Long empresaId, RegistrarPagamentoDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        if (dto == null || dto.novaDataVencimento() == null || dto.novaDataVencimento().isBlank()) {
            throw new RuntimeException("Informe a nova data de vencimento para registrar o pagamento.");
        }

        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setMotivoBloqueio(null);
        LocalDate novoVencimento = LocalDate.parse(dto.novaDataVencimento());
        empresa.setDataVencimento(novoVencimento);
        cobrancaAssinaturaService.registrarPagamentoManual(empresaId, novoVencimento);
        return toEmpresaDto(empresaRepository.save(empresa));
    }

    @Transactional
    public EmpresaAssinaturaResumoDTO reativarEmpresa(Long empresaId, RegistrarPagamentoDTO dto) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada."));
        empresa.setStatusAssinatura(StatusAssinatura.ATIVA);
        empresa.setMotivoBloqueio(null);
        if (dto != null && dto.novaDataVencimento() != null && !dto.novaDataVencimento().isBlank()) {
            empresa.setDataVencimento(LocalDate.parse(dto.novaDataVencimento()));
        } else if (empresa.getDataVencimento() == null || empresa.getDataVencimento().isBefore(LocalDate.now())) {
            empresa.setDataVencimento(LocalDate.now().plusDays(30));
        }
        cobrancaAssinaturaService.registrarPagamentoManual(empresaId, empresa.getDataVencimento());
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

        empresa.setPlano(dto.plano().trim().toUpperCase());
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

        return new EmpresaAssinaturaResumoDTO(
                empresa.getId(),
                empresa.getRazaoSocial(),
                empresa.getCnpj(),
                empresa.getEmailContato(),
                empresa.getTelefone(),
                empresa.getAtivo(),
                empresa.getStatusAssinatura() == null ? null : empresa.getStatusAssinatura().name(),
                empresa.getDataVencimento() == null ? null : empresa.getDataVencimento().toString(),
                empresa.getMotivoBloqueio(),
                adminPrincipal,
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
                ultimaCobranca == null || ultimaCobranca.getStatus() == null ? null : ultimaCobranca.getStatus().name(),
                ultimaCobranca == null || ultimaCobranca.getDataVencimento() == null ? null : ultimaCobranca.getDataVencimento().toString(),
                ultimaCobranca == null || ultimaCobranca.getValor() == null ? null : ultimaCobranca.getValor().doubleValue(),
                ultimaCobranca == null ? null : ultimaCobranca.getPaymentLink()
        );
    }

    public String usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SISTEMA";
        }
        return authentication.getName();
    }
}
