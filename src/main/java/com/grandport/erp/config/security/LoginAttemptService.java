package com.grandport.erp.config.security;

import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    private static final String PREFIX = "security:login-attempt:";

    private final StringRedisTemplate redisTemplate;
    private final RedisAvailabilityService redisAvailabilityService;
    private final Map<String, AttemptState> fallbackAttempts = new ConcurrentHashMap<>();

    public LoginAttemptService(StringRedisTemplate redisTemplate, RedisAvailabilityService redisAvailabilityService) {
        this.redisTemplate = redisTemplate;
        this.redisAvailabilityService = redisAvailabilityService;
    }

    public boolean isBlocked(String key) {
        try {
            return redisTemplate.hasKey(redisKey(key));
        } catch (RedisConnectionFailureException ex) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw ex;
            }
            return isBlockedFallback(key);
        }
    }

    public long secondsRemaining(String key) {
        try {
            Long seconds = redisTemplate.getExpire(redisKey(key));
            if (seconds == null || seconds < 0) {
                return 0;
            }
            return seconds;
        } catch (RedisConnectionFailureException ex) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw ex;
            }
            return secondsRemainingFallback(key);
        }
    }

    public void recordFailure(String key) {
        try {
            String redisKey = redisKey(key);
            Long attempts = redisTemplate.opsForValue().increment(redisKey);
            if (attempts == null) {
                return;
            }

            if (attempts == 1) {
                redisTemplate.expire(redisKey, LOCK_DURATION);
                return;
            }

            if (attempts >= MAX_ATTEMPTS) {
                redisTemplate.expire(redisKey, LOCK_DURATION);
            }
        } catch (RedisConnectionFailureException ex) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw ex;
            }
            recordFailureFallback(key);
        }
    }

    public void recordSuccess(String key) {
        try {
            redisTemplate.delete(redisKey(key));
        } catch (RedisConnectionFailureException ex) {
            if (redisAvailabilityService.isRedisRequired()) {
                throw ex;
            }
            fallbackAttempts.remove(key);
        }
    }

    private String redisKey(String key) {
        return PREFIX + key;
    }

    private boolean isBlockedFallback(String key) {
        AttemptState state = fallbackAttempts.get(key);
        if (state == null) {
            return false;
        }
        if (state.lockedUntil > 0 && state.lockedUntil > System.currentTimeMillis()) {
            return true;
        }
        if (state.lockedUntil > 0) {
            fallbackAttempts.remove(key);
        }
        return false;
    }

    private long secondsRemainingFallback(String key) {
        AttemptState state = fallbackAttempts.get(key);
        if (state == null || state.lockedUntil <= 0) {
            return 0;
        }
        long millis = state.lockedUntil - System.currentTimeMillis();
        return Math.max(0, millis / 1000);
    }

    private void recordFailureFallback(String key) {
        AttemptState state = fallbackAttempts.computeIfAbsent(key, ignored -> new AttemptState());
        state.attempts++;
        if (state.attempts >= MAX_ATTEMPTS) {
            state.lockedUntil = System.currentTimeMillis() + LOCK_DURATION.toMillis();
        }
    }

    private static final class AttemptState {
        private int attempts;
        private long lockedUntil;
    }
}
