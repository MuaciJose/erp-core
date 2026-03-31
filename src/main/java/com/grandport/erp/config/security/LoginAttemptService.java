package com.grandport.erp.config.security;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }
        if (state.lockedUntil > 0 && state.lockedUntil > System.currentTimeMillis()) {
            return true;
        }
        if (state.lockedUntil > 0) {
            attempts.remove(key);
        }
        return false;
    }

    public long secondsRemaining(String key) {
        AttemptState state = attempts.get(key);
        if (state == null || state.lockedUntil <= 0) {
            return 0;
        }
        long millis = state.lockedUntil - System.currentTimeMillis();
        return Math.max(0, millis / 1000);
    }

    public void recordFailure(String key) {
        AttemptState state = attempts.computeIfAbsent(key, ignored -> new AttemptState());
        state.attempts++;
        if (state.attempts >= MAX_ATTEMPTS) {
            state.lockedUntil = System.currentTimeMillis() + LOCK_DURATION.toMillis();
        }
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private static final class AttemptState {
        private int attempts;
        private long lockedUntil;
    }
}
