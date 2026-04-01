package com.grandport.erp.modules.assinatura.service;

import com.grandport.erp.modules.assinatura.dto.NovaEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.ConviteAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.ConvitePublicoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaAssinaturaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.RegistrarPagamentoDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoResumoDTO;
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

    public AssinaturaService(EmpresaRepository empresaRepository, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, PasswordPolicyService passwordPolicyService, AssinaturaInviteRepository assinaturaInviteRepository, SolicitacaoAcessoRepository solicitacaoAcessoRepository) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
        this.assinaturaInviteRepository = assinaturaInviteRepository;
        this.solicitacaoAcessoRepository = solicitacaoAcessoRepository;
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

        Empresa empresaSalva = empresaRepository.save(empresa);

        // 3. Cria o General (O Usuário Admin da nova empresa)
        Usuario admin = new Usuario();

        admin.setNomeCompleto(dto.nomeAdmin());
        admin.setUsername(dto.emailAdmin()); // Onde vai ficar salvo o e-mail de login
        admin.setSenha(passwordEncoder.encode(dto.senhaAdmin()));
        admin.setForcePasswordChange(false);
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
        empresa.setDataVencimento(LocalDate.parse(dto.novaDataVencimento()));
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
                adminPrincipal
        );
    }

    private String usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "SISTEMA";
        }
        return authentication.getName();
    }
}
