package com.grandport.erp.modules.usuario.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grandport.erp.config.security.RedisAvailabilityService;
import com.grandport.erp.modules.usuario.model.Usuario;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MfaChallengeService {

    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(5);
    private static final String PREFIX = "security:mfa-challenge:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RedisAvailabilityService redisAvailabilityService;
    private final Map<String, ChallengeState> fallbackChallenges = new ConcurrentHashMap<>();

    public MfaChallengeService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            RedisAvailabilityService redisAvailabilityService) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.redisAvailabilityService = redisAvailabilityService;
    }

    public String createChallenge(Usuario usuario, String setupSecret) {
        String token = UUID.randomUUID().toString();
        ChallengeState state = new ChallengeState(usuario.getId(), usuario.getUsername(), setupSecret, System.currentTimeMillis() + CHALLENGE_TTL.toMillis());
        try {
            redisTemplate.opsForValue().set(redisKey(token), objectMapper.writeValueAsString(state), CHALLENGE_TTL);
        } catch (RedisConnectionFailureException e) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw e;
            }
            fallbackChallenges.put(token, state);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Não foi possível persistir o desafio MFA.", e);
        }
        return token;
    }

    public ChallengeState require(String token) {
        try {
            String payload = redisTemplate.opsForValue().get(redisKey(token));
            if (payload == null || payload.isBlank()) {
                throw new IllegalArgumentException("Desafio MFA expirado. Faça login novamente.");
            }
            ChallengeState state = objectMapper.readValue(payload, ChallengeState.class);
            if (state.expiresAt < System.currentTimeMillis()) {
                consume(token);
                throw new IllegalArgumentException("Desafio MFA expirado. Faça login novamente.");
            }
            return state;
        } catch (RedisConnectionFailureException e) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw e;
            }
            return requireFallback(token);
        } catch (JsonProcessingException e) {
            consume(token);
            throw new IllegalStateException("Desafio MFA inválido.", e);
        }
    }

    public void consume(String token) {
        try {
            redisTemplate.delete(redisKey(token));
        } catch (RedisConnectionFailureException e) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw e;
            }
            fallbackChallenges.remove(token);
        }
    }

    private String redisKey(String token) {
        return PREFIX + token;
    }

    private ChallengeState requireFallback(String token) {
        ChallengeState state = fallbackChallenges.get(token);
        if (state == null || state.expiresAt < System.currentTimeMillis()) {
            fallbackChallenges.remove(token);
            throw new IllegalArgumentException("Desafio MFA expirado. Faça login novamente.");
        }
        return state;
    }

    public record ChallengeState(Long usuarioId, String username, String setupSecret, long expiresAt) {}
}
