package com.grandport.erp.config.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RedisStartupValidator implements CommandLineRunner {

    private final RedisAvailabilityService redisAvailabilityService;

    public RedisStartupValidator(RedisAvailabilityService redisAvailabilityService) {
        this.redisAvailabilityService = redisAvailabilityService;
    }

    @Override
    public void run(String... args) {
        if (redisAvailabilityService.isRedisRequired()) {
            redisAvailabilityService.assertAvailable();
        }
    }
}
