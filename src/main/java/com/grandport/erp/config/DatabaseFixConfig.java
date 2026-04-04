package com.grandport.erp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseFixConfig.class);

    @Bean
    public CommandLineRunner fixPostgresConstraint(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Pede para o banco de dados quebrar a trava antiga de status
                jdbcTemplate.execute("ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;");
                log.info("Trava legada de status da OS removida com sucesso no PostgreSQL");
            } catch (Exception e) {
                log.debug("Trava legada da OS já removida ou banco incompatível com o ajuste", e);
            }
        };
    }
}
