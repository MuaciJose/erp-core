package com.grandport.erp.config.ratelimit;

import java.util.concurrent.atomic.AtomicInteger;

final class RequestCounter {

    private final AtomicInteger count = new AtomicInteger(0);
    private long lastResetTime = System.currentTimeMillis();

    int increment() {
        return count.incrementAndGet();
    }

    int getCount() {
        return count.get();
    }

    void reset() {
        count.set(0);
        lastResetTime = System.currentTimeMillis();
    }

    boolean isExpired() {
        return System.currentTimeMillis() - lastResetTime > RateLimitInterceptor.WINDOW_MS;
    }
}
