package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder; // 🚀 INJEÇÃO DE SEGURANÇA
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired private UsuarioRepository repository;
    @Autowired private AuditoriaService auditoriaService;

    // =======================================================================
    // 🚀 1. LISTAGEM BLINDADA (Só enxerga a própria base)
    // =======================================================================
    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        // Pega a identidade do general que está acessando a tela
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Troca o findAll() pelo findByEmpresaId()!
        List<UsuarioDTO> usuarios = repository.findByEmpresaId(usuarioLogado.getEmpresaId()).stream()
                .map(UsuarioDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }

    // =======================================================================
    // 🚀 2. CRIAÇÃO BLINDADA (Carimba o novo soldado na base correta)
    // =======================================================================
    @PostMapping
    public ResponseEntity<UsuarioDTO> criar(@RequestBody UsuarioDTO dto) {
        Usuario usuarioLogado = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Usuario novo = new Usuario();
        novo.setNomeCompleto(dto.getNome());
        novo.setUsername(dto.getEmail());
        novo.setSenha(new BCryptPasswordEncoder().encode(dto.getSenha()));
        novo.setPermissoes(dto.getPermissoes());
        novo.setAtivo(true);

        // 🔐 A CHAVE DE SEGURANÇA: Força o novo usuário a ter o mesmo ID de empresa do criador!
        novo.setEmpresaId(usuarioLogado.getEmpresaId());

        Usuario salvo = repository.save(novo);
        auditoriaService.registrar("SISTEMA", "CRIACAO_USUARIO", "Cadastrou o usuário: " + salvo.getNomeCompleto());
        return ResponseEntity.ok(new UsuarioDTO(salvo));
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
        usuario.setPermissoes(dto.getPermissoes());

        if (dto.getSenha() != null && !dto.getSenha().isEmpty()) {
            usuario.setSenha(new BCryptPasswordEncoder().encode(dto.getSenha()));
        }

        Usuario salvo = repository.save(usuario);
        auditoriaService.registrar("SISTEMA", "EDICAO_USUARIO", "Atualizou o usuário: " + salvo.getNomeCompleto());
        return ResponseEntity.ok(new UsuarioDTO(salvo));
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
}