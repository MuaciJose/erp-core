package com.grandport.erp.modules.admin.repository;

import com.grandport.erp.modules.admin.model.LogAuditoria;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
        "api.security.token.secret=test-jwt-secret"
})
@DisplayName("Integracao - LogAuditoria Repository")
class LogAuditoriaRepositoryIntegrationTest {

    @Autowired
    private LogAuditoriaRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
