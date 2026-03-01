package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        List<UsuarioDTO> usuarios = repository.findAll().stream()
                .map(UsuarioDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> criar(@RequestBody UsuarioDTO dto) {
        Usuario novo = new Usuario();
        novo.setNomeCompleto(dto.getNome());
        novo.setUsername(dto.getEmail());
        novo.setSenha(new BCryptPasswordEncoder().encode(dto.getSenha()));
        novo.setPermissoes(dto.getPermissoes());
        novo.setAtivo(true);
        
        Usuario salvo = repository.save(novo);
        auditoriaService.registrar("SISTEMA", "CRIACAO_USUARIO", "Cadastrou o usuário: " + salvo.getNomeCompleto());
        return ResponseEntity.ok(new UsuarioDTO(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> atualizar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
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
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        boolean novoStatus = payload.get("ativo");
        usuario.setAtivo(novoStatus);
        repository.save(usuario);
        
        auditoriaService.registrar("SISTEMA", "STATUS_USUARIO", (novoStatus ? "Desbloqueou" : "Bloqueou") + " o acesso de: " + usuario.getNomeCompleto());
        return ResponseEntity.ok().build();
    }
}
