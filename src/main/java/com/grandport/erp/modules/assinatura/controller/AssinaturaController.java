package com.grandport.erp.modules.assinatura.controller;

import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoDTO;
import com.grandport.erp.modules.assinatura.dto.NovaEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.ConviteAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.CobrancaAssinaturaDTO;
import com.grandport.erp.modules.assinatura.dto.CriarCobrancaDTO;
import com.grandport.erp.modules.assinatura.dto.ConvitePublicoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaAssinaturaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.dto.RegistrarPagamentoDTO;
import com.grandport.erp.modules.assinatura.dto.SalvarEmpresaIncidenteDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarPlanoEmpresaDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.SolicitacaoAcessoResumoDTO;
import com.grandport.erp.modules.assinatura.dto.WebhookPagamentoDTO;
import com.grandport.erp.modules.assinatura.dto.AtualizarLicencaModuloDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.EmpresaTimelineEventoDTO;
import com.grandport.erp.modules.assinatura.dto.LiberacaoManualCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.ModuloLicencaResumoDTO;
import com.grandport.erp.modules.assinatura.dto.PlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.dto.ProrrogarCadastroComplementarDTO;
import com.grandport.erp.modules.assinatura.dto.SaasOperacaoResumoDTO;
import com.grandport.erp.modules.assinatura.dto.SalvarPlataformaAvisoOperacionalDTO;
import com.grandport.erp.modules.assinatura.service.AssinaturaService;
import com.grandport.erp.modules.assinatura.service.CobrancaAssinaturaService;
import com.grandport.erp.modules.assinatura.service.IncidenteEmpresaService;
import com.grandport.erp.modules.assinatura.service.LicenciamentoModuloService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assinaturas")
public class AssinaturaController {

    private final AssinaturaService assinaturaService;
    private final CobrancaAssinaturaService cobrancaAssinaturaService;
    private final LicenciamentoModuloService licenciamentoModuloService;
    private final IncidenteEmpresaService incidenteEmpresaService;

    public AssinaturaController(AssinaturaService assinaturaService, CobrancaAssinaturaService cobrancaAssinaturaService, LicenciamentoModuloService licenciamentoModuloService, IncidenteEmpresaService incidenteEmpresaService) {
        this.assinaturaService = assinaturaService;
        this.cobrancaAssinaturaService = cobrancaAssinaturaService;
        this.licenciamentoModuloService = licenciamentoModuloService;
        this.incidenteEmpresaService = incidenteEmpresaService;
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

    @GetMapping("/empresas/{id}/cadastro-complementar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public EmpresaCadastroComplementarDTO obterCadastroComplementarEmpresa(@PathVariable Long id) {
        return assinaturaService.obterCadastroComplementarEmpresa(id);
    }

    @PostMapping("/empresas/{id}/cadastro-complementar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarCadastroComplementarEmpresa(@PathVariable Long id, @RequestBody AtualizarCadastroComplementarDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.atualizarCadastroComplementarEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/cadastro-complementar/prorrogar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> prorrogarCadastroComplementarEmpresa(@PathVariable Long id, @RequestBody(required = false) ProrrogarCadastroComplementarDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.prorrogarCadastroComplementarEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/cadastro-complementar/liberacao-manual")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarLiberacaoManualCadastroComplementarEmpresa(@PathVariable Long id, @RequestBody(required = false) LiberacaoManualCadastroComplementarDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.atualizarLiberacaoManualCadastroComplementarEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/minha-empresa/cadastro-complementar")
    public EmpresaCadastroComplementarDTO obterMeuCadastroComplementar() {
        return assinaturaService.obterMeuCadastroComplementar();
    }

    @PostMapping("/minha-empresa/cadastro-complementar")
    public ResponseEntity<?> atualizarMeuCadastroComplementar(@RequestBody AtualizarCadastroComplementarDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.atualizarMeuCadastroComplementar(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/resumo-operacao")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public SaasOperacaoResumoDTO resumoOperacao() {
        assinaturaService.validarAcessoPlataforma();
        return assinaturaService.obterResumoOperacao();
    }

    @GetMapping("/plataforma/aviso-manutencao")
    public PlataformaAvisoOperacionalDTO obterAvisoManutencaoPlataforma() {
        return assinaturaService.obterAvisoManutencaoPlataforma();
    }

    @PostMapping("/plataforma/aviso-manutencao")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> salvarAvisoManutencaoPlataforma(@RequestBody(required = false) SalvarPlataformaAvisoOperacionalDTO dto) {
        try {
            return ResponseEntity.ok(assinaturaService.salvarAvisoManutencaoPlataforma(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @PostMapping("/empresas/{id}/cancelar")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> cancelarEmpresa(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(assinaturaService.cancelarEmpresa(id, payload == null ? null : payload.get("motivoBloqueio")));
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

    @GetMapping("/empresas/{id}/modulos")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<ModuloLicencaResumoDTO> listarModulosEmpresa(@PathVariable Long id) {
        assinaturaService.validarAcessoPlataforma();
        return licenciamentoModuloService.listarLicencasEmpresa(id);
    }

    @GetMapping("/empresas/{id}/timeline")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<EmpresaTimelineEventoDTO> listarTimelineEmpresa(@PathVariable Long id) {
        assinaturaService.validarAcessoPlataforma();
        return assinaturaService.listarTimelineEmpresa(id);
    }

    @GetMapping("/empresas/{id}/incidentes")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<EmpresaIncidenteDTO> listarIncidentesEmpresa(@PathVariable Long id) {
        assinaturaService.validarAcessoPlataforma();
        return incidenteEmpresaService.listarPorEmpresa(id);
    }

    @PostMapping("/empresas/{id}/incidentes")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> criarIncidenteEmpresa(@PathVariable Long id, @RequestBody SalvarEmpresaIncidenteDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(incidenteEmpresaService.criar(id, dto, assinaturaService.usuarioAtual()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{empresaId}/incidentes/{incidenteId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarIncidenteEmpresa(@PathVariable Long empresaId, @PathVariable Long incidenteId, @RequestBody SalvarEmpresaIncidenteDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(incidenteEmpresaService.atualizar(empresaId, incidenteId, dto, assinaturaService.usuarioAtual()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/empresas/{id}/modulos")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> atualizarModuloEmpresa(@PathVariable Long id, @RequestBody AtualizarLicencaModuloDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(licenciamentoModuloService.atualizarLicencaEmpresa(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/empresas/{id}/cobrancas")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public List<CobrancaAssinaturaDTO> listarCobrancas(@PathVariable Long id) {
        assinaturaService.validarAcessoPlataforma();
        return cobrancaAssinaturaService.listarPorEmpresa(id);
    }

    @PostMapping("/empresas/{id}/cobrancas")
    @PreAuthorize("hasAnyAuthority('ROLE_USUARIOS', 'ROLE_CONFIGURACOES')")
    public ResponseEntity<?> criarCobranca(@PathVariable Long id, @RequestBody CriarCobrancaDTO dto) {
        try {
            assinaturaService.validarAcessoPlataforma();
            return ResponseEntity.ok(cobrancaAssinaturaService.criarCobranca(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/webhooks/pagamentos")
    public ResponseEntity<?> processarWebhookPagamento(
            @RequestHeader(value = "X-Webhook-Token", required = false) String token,
            @RequestBody WebhookPagamentoDTO dto) {
        try {
            cobrancaAssinaturaService.processarWebhook(dto, token);
            return ResponseEntity.ok(Map.of("message", "Webhook processado."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
