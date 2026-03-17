package com.grandport.erp.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixConfig {

    @Bean
    public CommandLineRunner fixPostgresConstraint(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Pede para o banco de dados quebrar a trava antiga de status
                jdbcTemplate.execute("ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;");
                System.out.println("🔧 Trava do PostgreSQL (Status OS) removida com sucesso!");
            } catch (Exception e) {
                System.out.println("🔧 Trava já removida ou banco diferente.");
            }
        };
    }
}