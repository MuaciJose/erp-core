package com.grandport.erp.modules.assinatura.controller;

import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoDTO;
import com.grandport.erp.modules.assinatura.dto.NovaEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.ConviteAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.ConvitePublicoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaAssinaturaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.RegistrarPagamentoDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarPlanoEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoResumoDTO;
import com.grandport.erp.modules.assinatura.service.AssinaturaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assinaturas")
public class AssinaturaController {

    private final AssinaturaService assinaturaService;

    public AssinaturaController(AssinaturaService assinaturaService) {
        this.assinaturaService = assinaturaService;
    }

    @PostMapping("/nova-empresa")
    public ResponseEntity<?> registarEmpresa(@RequestBody NovaEmpresaDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.registarNovaEmpresa(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/solicitacoes-acesso")
    public ResponseEntity<?> solicitarAcesso(@RequestBody SolicitacaoAcessoDTO dto) {
        try {
            assinaturaService.solicitarAcesso(dto);
            return ResponseEntity.ok(Map.of("message", "Solicitação enviada com sucesso. Nossa equipe fará a liberação do seu acesso."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/convites/publico/{token}")
    public ResponseEntity<?> consultarConvitePublico(@PathVariable String token) {
        try {
            ConvitePublicoDTO convite = assinaturaService.consultarConvitePublico(token);
            return ResponseEntity.ok(convite);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/solicitacoes-acesso")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<SolicitacaoAcessoResumoDTO> listarSolicitacoes() {
        assinaturaService.validarAcessoPlataforma();
        return assinaturaService.listarSolicitacoes();
    }

    @PostMapping("/solicitacoes-acesso/{id}/aprovar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> aprovarSolicitacao(@PathVariable Long id) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.aprovarSolicitacao(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/convites")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<ConviteAssinaturaDTO> listarConvites() {
        assinaturaService.validarAcessoPlataforma();
        return assinaturaService.listarConvites();
    }

    @PostMapping("/convites")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> criarConvite(@RequestBody Map<String, String> payload) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.gerarConvite(payload.get("emailDestino")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/empresas")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<EmpresaAssinaturaResumoDTO> listarEmpresas() {
        assinaturaService.validarAcessoPlataforma();
        return assinaturaService.listarEmpresas();
    }

    @PostMapping("/empresas/{id}/bloquear")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> bloquearEmpresa(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.bloquearEmpresa(id, payload == null ? null : payload.get("motivoBloqueio")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/registrar-pagamento")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> registrarPagamento(@PathVariable Long id, @RequestBody RegistrarPagamentoDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.registrarPagamento(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/reativar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> reativarEmpresa(@PathVariable Long id, @RequestBody(required = false) RegistrarPagamentoDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.reativarEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/plano")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarPlano(@PathVariable Long id, @RequestBody AtualizarPlanoEmpresaDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.atualizarPlanoEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
