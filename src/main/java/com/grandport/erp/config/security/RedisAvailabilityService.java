package com.grandport.erp.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

@Service
public class RedisAvailabilityService {

    private final RedisConnectionFactory redisConnectionFactory;
    private final boolean redisRequired;

    public RedisAvailabilityService(
            RedisConnectionFactory redisConnectionFactory,
            @Value("${app.security.redis.required:false}") boolean redisRequired) {
        this.redisConnectionFactory = redisConnectionFactory;
        this.redisRequired = redisRequired;
    }

    public boolean isRedisRequired() {
        return redisRequired;
    }

    public boolean isAvailable() {
        try (var connection = redisConnectionFactory.getConnection()) {
            return "PONG".equalsIgnoreCase(connection.ping());
        } catch (Exception ex) {
            return false;
        }
    }

    public void assertAvailable() {
        try (var connection = redisConnectionFactory.getConnection()) {
            connection.ping();
        } catch (RedisConnectionFailureException ex) {
            throw new IllegalStateException("Redis obrigatório não está disponível. Configure REDIS_HOST/REDIS_PORT e suba o serviço antes de iniciar a aplicação.", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Falha ao validar Redis obrigatório na inicialização.", ex);
        }
    }
}
