package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.model.TipoAcesso;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder; // 🚀 INJEÇÃO DE SEGURANÇA
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasAuthority('ROLE_USUARIOS')")
public class UsuarioController {

    @Autowired private UsuarioRepository repository;
    @Autowired private AuditoriaService auditoriaService;
    @Autowired private SecurityEventService securityEventService;
    @Autowired private PasswordPolicyService passwordPolicyService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PlanoPermissaoService planoPermissaoService;

    // =======================================================================
    // 🚀 1. LISTAGEM BLINDADA (Só enxerga a própria base)
    // =======================================================================
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        // Pega a identidade do general que está acessando a tela
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Troca o findAll() pelo findByEmpresaId()!
        List<UsuarioDTO> usuarios = repository.findByEmpresaId(usuarioLogado.getEmpresaId()).stream()
                .map(planoPermissaoService::toDtoFiltrado)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }

    // =======================================================================
    // 🚀 2. CRIAÇÃO BLINDADA (Carimba o novo soldado na base correta)
    // =======================================================================
    @PostMapping
    public ResponseEntity<UsuarioDTO> criar(@RequestBody UsuarioDTO dto) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        passwordPolicyService.validateOrThrow(dto.getSenha());

        TipoAcesso tipoSolicitado = dto.getTipoAcesso() != null ? dto.getTipoAcesso() : TipoAcesso.TENANT_USER;
        if (tipoSolicitado == TipoAcesso.PLATFORM_ADMIN && usuarioLogado.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Apenas administradores da plataforma podem criar PLATFORM_ADMIN.");
        }

        Usuario novo = new Usuario();
        novo.setNomeCompleto(dto.getNome());
        novo.setUsername(dto.getEmail());
        novo.setSenha(passwordEncoder.encode(dto.getSenha()));
        novo.setPermissoes(planoPermissaoService.filtrarPermissoes(usuarioLogado.getEmpresaId(), dto.getPermissoes()));
        novo.setAtivo(true);
        novo.setMfaEnabled(dto.isMfaEnabled());
        novo.setForcePasswordChange(dto.isForcePasswordChange());
        novo.setTipoAcesso(tipoSolicitado);

        // 🔐 A CHAVE DE SEGURANÇA: Força o novo usuário a ter o mesmo ID de empresa do criador!
        novo.setEmpresaId(usuarioLogado.getEmpresaId());

        Usuario salvo = repository.save(novo);
        auditoriaService.registrar("SISTEMA", "CRIACAO_USUARIO", "Cadastrou o usuário: " + salvo.getNomeCompleto());
        return ResponseEntity.ok(planoPermissaoService.toDtoFiltrado(salvo));
    }

    // =======================================================================
    // 🚀 3. EDIÇÃO BLINDADA (Impede de editar usuário de outra loja)
    // =======================================================================
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> atualizar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // O Sniper procura o usuário, MAS exige que ele seja da mesma empresa do logado!
        Usuario usuario = repository.findByIdAndEmpresaId(id, usuarioLogado.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado nesta empresa!"));

        usuario.setNomeCompleto(dto.getNome());
        usuario.setUsername(dto.getEmail());
        usuario.setPermissoes(planoPermissaoService.filtrarPermissoes(usuarioLogado.getEmpresaId(), dto.getPermissoes()));
        usuario.setMfaEnabled(dto.isMfaEnabled());
        usuario.setForcePasswordChange(dto.isForcePasswordChange());
        TipoAcesso tipoSolicitado = dto.getTipoAcesso() != null ? dto.getTipoAcesso() : usuario.getTipoAcesso();
        if (tipoSolicitado == TipoAcesso.PLATFORM_ADMIN && usuarioLogado.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Apenas administradores da plataforma podem definir PLATFORM_ADMIN.");
        }
        if (usuario.getTipoAcesso() == TipoAcesso.PLATFORM_ADMIN && usuarioLogado.getTipoAcesso() != TipoAcesso.PLATFORM_ADMIN) {
            throw new RuntimeException("Apenas administradores da plataforma podem editar PLATFORM_ADMIN.");
        }
        usuario.setTipoAcesso(tipoSolicitado);

        String senhaNormalizada = dto.getSenha() == null ? null : dto.getSenha().trim();
        if (senhaNormalizada != null && !senhaNormalizada.isEmpty()) {
            passwordPolicyService.validateOrThrow(senhaNormalizada);
            usuario.setSenha(passwordEncoder.encode(senhaNormalizada));
            usuario.setForcePasswordChange(true);
        }

        Usuario salvo = repository.save(usuario);
        auditoriaService.registrar("SISTEMA", "EDICAO_USUARIO", "Atualizou o usuário: " + salvo.getNomeCompleto());
        return ResponseEntity.ok(planoPermissaoService.toDtoFiltrado(salvo));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> alternarStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Usuario usuario = repository.findByIdAndEmpresaId(id, usuarioLogado.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado nesta empresa!"));

        boolean novoStatus = payload.get("ativo");
        usuario.setAtivo(novoStatus);
        repository.save(usuario);

        auditoriaService.registrar("SISTEMA", "STATUS_USUARIO", (novoStatus ? "Desbloqueou" : "Bloqueou") + " o acesso de: " + usuario.getNomeCompleto());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/revogar-mfa")
    public ResponseEntity<Void> revogarMfa(@PathVariable Long id) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Usuario usuario = repository.findByIdAndEmpresaId(id, usuarioLogado.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado nesta empresa!"));

        usuario.setMfaEnabled(false);
        usuario.setMfaSecret(null);
        repository.save(usuario);

        auditoriaService.registrar("SEGURANCA", "REVOGAR_MFA", "Revogou o MFA do usuário: " + usuario.getNomeCompleto());
        securityEventService.registrar(usuarioLogado.getEmpresaId(), "REVOGAR_MFA", "WARN", usuario.getUsername(), null, "MFA revogado por administrador.");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/forcar-reset-senha")
    public ResponseEntity<Void> forcarResetSenha(@PathVariable Long id) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Usuario usuario = repository.findByIdAndEmpresaId(id, usuarioLogado.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado nesta empresa!"));

        usuario.setForcePasswordChange(true);
        repository.save(usuario);

        auditoriaService.registrar("SEGURANCA", "FORCAR_RESET_SENHA", "Forçou nova senha para o usuário: " + usuario.getNomeCompleto());
        securityEventService.registrar(usuarioLogado.getEmpresaId(), "FORCAR_RESET_SENHA", "WARN", usuario.getUsername(), null, "Reset de senha marcado para o próximo login.");
        return ResponseEntity.ok().build();
    }
}
