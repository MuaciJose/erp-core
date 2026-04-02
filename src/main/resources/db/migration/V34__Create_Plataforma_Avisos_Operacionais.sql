CREATE TABLE IF NOT EXISTS plataforma_avisos_operacionais (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(40) NOT NULL,
    severidade VARCHAR(20) NOT NULL DEFAULT 'MANUTENCAO',
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    bloquear_acesso BOOLEAN NOT NULL DEFAULT FALSE,
    titulo VARCHAR(160) NOT NULL,
    mensagem TEXT NULL,
    inicio_previsto TIMESTAMP NULL,
    fim_previsto TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_plataforma_aviso_tipo
    ON plataforma_avisos_operacionais (tipo);
