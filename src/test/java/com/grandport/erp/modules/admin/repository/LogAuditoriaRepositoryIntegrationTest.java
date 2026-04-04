package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Transactional
@EnabledIfEnvironmentVariable(named = "RUN_DB_INTEGRATION_TESTS", matches = "true")
@TestPropertySource(properties = {
        "api.security.token.secret=test-jwt-secret",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false"
})
@DisplayName("Integracao - LogAuditoria Repository")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LogAuditoriaRepositoryIntegrationTest {

    @Autowired
    private LogAuditoriaRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @BeforeAll
    void migrateDatabase() {
        jdbcTemplate.execute("""
                create table if not exists logs_auditoria (
                    id bigserial primary key,
                    empresa_id bigint,
                    data_hora timestamp,
                    usuario_nome varchar(255),
                    modulo varchar(255),
                    acao varchar(255),
                    detalhes text,
                    ip_origem varchar(255)
                )
                """);
    }

    @Test
    @DisplayName("Deve filtrar por busca em detalhes sem quebrar no Postgres")
    void deveFiltrarPorBuscaEmDetalhesSemQuebrarNoPostgres() {
        jdbcTemplate.update(
                """
                insert into logs_auditoria (empresa_id, data_hora, usuario_nome, modulo, acao, detalhes, ip_origem)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                901L,
                LocalDateTime.now().minusMinutes(2),
                "Owner SaaS",
                "SAAS",
                "LICENCA_MODULO",
                "Bloqueio comercial do modulo fiscal por inadimplencia",
                "127.0.0.1"
        );
        jdbcTemplate.update(
                """
                insert into logs_auditoria (empresa_id, data_hora, usuario_nome, modulo, acao, detalhes, ip_origem)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                901L,
                LocalDateTime.now().minusMinutes(1),
                "Owner SaaS",
                "BILLING",
                "COBRANCA",
                "Cobranca mensal processada",
                "127.0.0.1"
        );

        var pagina = repository.buscarFiltrado(
                901L,
                null,
                null,
                "fiscal",
                null,
                null,
                PageRequest.of(0, 20)
        );

        assertEquals(1, pagina.getTotalElements());
        assertFalse(pagina.getContent().isEmpty());
        assertEquals("LICENCA_MODULO", pagina.getContent().get(0).getAcao());
        assertEquals("SAAS", pagina.getContent().get(0).getModulo());
    }
}
