package com.grandport.erp.modules.usuario.controller;

import com.grandport.erp.config.security.LoginAttemptService;
import com.grandport.erp.config.security.AuthCookieService;
import com.grandport.erp.modules.admin.service.AuditoriaService;
import com.grandport.erp.modules.admin.service.SecurityEventService;
import com.grandport.erp.modules.assinatura.service.PlanoPermissaoService;
import com.grandport.erp.modules.usuario.dto.AuthFlowResponseDTO;
import com.grandport.erp.modules.usuario.dto.LoginDTO;
import com.grandport.erp.modules.usuario.dto.MfaVerifyDTO;
import com.grandport.erp.modules.usuario.dto.TrocaSenhaDTO;
import com.grandport.erp.modules.usuario.dto.UsuarioDTO;
import com.grandport.erp.modules.usuario.model.Usuario;
import com.grandport.erp.modules.usuario.repository.UsuarioRepository;
import com.grandport.erp.modules.usuario.service.MfaChallengeService;
import com.grandport.erp.modules.usuario.service.PasswordPolicyService;
import com.grandport.erp.modules.usuario.service.TokenService;
import com.grandport.erp.modules.usuario.service.TotpService;
import com.grandport.erp.modules.assinatura.service.TenantAccessBlockedException;
import com.grandport.erp.modules.assinatura.service.TenantAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AutenticacaoController {

    private final AuthenticationManager authenticationManager;
    private final AuthCookieService authCookieService;
    private final TokenService tokenService;
    private final AuditoriaService auditoriaService;
    private final LoginAttemptService loginAttemptService;
    private final PasswordPolicyService passwordPolicyService;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;
    private final MfaChallengeService mfaChallengeService;
    private final TotpService totpService;
    private final SecurityEventService securityEventService;
    private final TenantAccessService tenantAccessService;
    private final PlanoPermissaoService planoPermissaoService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginDTO data, HttpServletRequest request) {
        String ip = resolveClientIp(request);
        String username = data.username() == null ? "" : data.username().trim().toLowerCase();
        String ipKey = "ip:" + ip;
        String userKey = "user:" + username;

        if (loginAttemptService.isBlocked(ipKey) || loginAttemptService.isBlocked(userKey)) {
            long waitSeconds = Math.max(
                    loginAttemptService.secondsRemaining(ipKey),
                    loginAttemptService.secondsRemaining(userKey)
            );
            securityEventService.registrar(null, "LOGIN_BLOQUEADO", "CRITICAL", username, ip,
                    "Login temporariamente bloqueado por excesso de tentativas. Retry after " + waitSeconds + "s.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "error", "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
                            "retryAfterSeconds", waitSeconds
                    ));
        }

        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.username(), data.senha());
            var auth = this.authenticationManager.authenticate(usernamePassword);

            Usuario usuario = (Usuario) auth.getPrincipal();
            tenantAccessService.validarAcesso(usuario);
            loginAttemptService.recordSuccess(ipKey);
            loginAttemptService.recordSuccess(userKey);
            auditoriaService.registrar("SEGURANCA", "LOGIN_SUCESSO", "Login realizado para o usuário: " + usuario.getUsername());
            securityEventService.registrar(usuario.getEmpresaId(), "LOGIN_SUCESSO", "INFO", usuario.getUsername(), ip, "Login com credenciais válidas.");

            if (requiresMfa(usuario)) {
                String setupSecret = null;
                boolean setupRequired = !usuario.isMfaEnabled() || usuario.getMfaSecret() == null || usuario.getMfaSecret().isBlank();
                if (setupRequired) {
                    setupSecret = totpService.generateSecret();
                }
                String challengeToken = mfaChallengeService.createChallenge(usuario, setupSecret);
                String otpauthUri = setupRequired ? totpService.buildOtpAuthUri("Grandport ERP", usuario.getUsername(), setupSecret) : null;
                return ResponseEntity.ok(new AuthFlowResponseDTO(
                        null,
                        planoPermissaoService.toDtoFiltrado(usuario),
                        !setupRequired,
                        setupRequired,
                        challengeToken,
                        setupSecret,
                        otpauthUri,
                        setupRequired ? totpService.buildQrCodeDataUrl(otpauthUri, 220) : null,
                        setupRequired
                                ? "Configure o aplicativo autenticador e informe o código para concluir o acesso."
                                : "Informe o código do autenticador para concluir o login."
                ));
            }

            return buildSuccessResponseEntity(usuario);
        } catch (TenantAccessBlockedException ex) {
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(Map.of("error", ex.getMessage()));
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(ipKey);
            loginAttemptService.recordFailure(userKey);
            auditoriaService.registrar("SEGURANCA", "LOGIN_FALHA", "Falha de login para o usuário: " + username);
            securityEventService.registrar(null, "LOGIN_FALHA", "WARN", username, ip, "Credenciais inválidas.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuário ou senha incorretos."));
        }
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verifyMfa(@RequestBody @Valid MfaVerifyDTO data) {
        var challenge = mfaChallengeService.require(data.challengeToken());
        Usuario usuario = usuarioRepository.findById(challenge.usuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário do desafio MFA não encontrado."));

        String secret = challenge.setupSecret() != null ? challenge.setupSecret() : usuario.getMfaSecret();
        if (!totpService.verifyCode(secret, data.code())) {
            auditoriaService.registrar("SEGURANCA", "MFA_FALHA", "Código MFA inválido para o usuário: " + usuario.getUsername());
            securityEventService.registrar(usuario.getEmpresaId(), "MFA_FALHA", "WARN", usuario.getUsername(), null, "Código MFA inválido.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Código MFA inválido ou expirado."));
        }

        if (challenge.setupSecret() != null) {
            usuario.setMfaSecret(challenge.setupSecret());
            usuario.setMfaEnabled(true);
            usuarioRepository.save(usuario);
            auditoriaService.registrar("SEGURANCA", "MFA_ATIVADO", "MFA ativado para o usuário: " + usuario.getUsername());
            securityEventService.registrar(usuario.getEmpresaId(), "MFA_ATIVADO", "INFO", usuario.getUsername(), null, "MFA ativado no primeiro login seguro.");
        } else {
            auditoriaService.registrar("SEGURANCA", "MFA_SUCESSO", "MFA validado para o usuário: " + usuario.getUsername());
            securityEventService.registrar(usuario.getEmpresaId(), "MFA_SUCESSO", "INFO", usuario.getUsername(), null, "MFA validado com sucesso.");
        }

        mfaChallengeService.consume(data.challengeToken());
        return buildSuccessResponseEntity(usuario);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        auditoriaService.registrar("SISTEMA", "LOGOUT", "Usuário realizou logout do sistema.");
        HttpHeaders headers = new HttpHeaders();
        authCookieService.clearAuthCookie(headers);
        return ResponseEntity.ok().headers(headers).build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> me(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(planoPermissaoService.toDtoFiltrado(usuario));
    }

    @PostMapping("/trocar-senha")
    public ResponseEntity<?> trocarSenha(@RequestBody @Valid TrocaSenhaDTO data, Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if (data.senhaAtual() == null || !passwordEncoder.matches(data.senhaAtual(), usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "A senha atual informada não confere."));
        }

        passwordPolicyService.validateOrThrow(data.novaSenha());
        usuario.setSenha(passwordEncoder.encode(data.novaSenha()));
        usuario.setForcePasswordChange(false);
        usuarioRepository.save(usuario);
        auditoriaService.registrar("SEGURANCA", "TROCA_SENHA", "Usuário trocou a própria senha.");
        securityEventService.registrar(usuario.getEmpresaId(), "TROCA_SENHA", "INFO", usuario.getUsername(), null, "Senha alterada pelo próprio usuário.");
        return ResponseEntity.ok(planoPermissaoService.toDtoFiltrado(usuario));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean requiresMfa(Usuario usuario) {
        if (usuario == null) {
            return false;
        }
        if (usuario.isMfaEnabled()) {
            return true;
        }
        return usuario.getTipoAcesso() == com.grandport.erp.modules.usuario.model.TipoAcesso.TENANT_ADMIN
                || usuario.getTipoAcesso() == com.grandport.erp.modules.usuario.model.TipoAcesso.PLATFORM_ADMIN;
    }

    private AuthFlowResponseDTO buildSuccessResponse(Usuario usuario) {
        var token = tokenService.gerarToken(usuario);
        return new AuthFlowResponseDTO(
                token,
                planoPermissaoService.toDtoFiltrado(usuario),
                false,
                false,
                null,
                null,
                null,
                null,
                null
        );
    }

    private ResponseEntity<AuthFlowResponseDTO> buildSuccessResponseEntity(Usuario usuario) {
        AuthFlowResponseDTO body = buildSuccessResponse(usuario);
        HttpHeaders headers = new HttpHeaders();
        authCookieService.writeAuthCookie(headers, body.token(), tokenService.getExpirationSeconds());
        return ResponseEntity.ok().headers(headers).body(body);
    }
}
