package com.grandport.erp.modules.usuario.service;

import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MfaChallengeService {

    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(5);

    private final Map<String, ChallengeState> challenges = new ConcurrentHashMap<>();

    public String createChallenge(Usuario usuario, String setupSecret) {
        String token = UUID.randomUUID().toString();
        ChallengeState state = new ChallengeState(usuario.getId(), usuario.getUsername(), setupSecret, System.currentTimeMillis() + CHALLENGE_TTL.toMillis());
        challenges.put(token, state);
        return token;
    }

    public ChallengeState require(String token) {
        ChallengeState state = challenges.get(token);
        if (state == null || state.expiresAt < System.currentTimeMillis()) {
            challenges.remove(token);
            throw new IllegalArgumentException("Desafio MFA expirado. Faça login novamente.");
        }
        return state;
    }

    public void consume(String token) {
        challenges.remove(token);
    }

    public record ChallengeState(Long usuarioId, String username, String setupSecret, long expiresAt) {}
}
