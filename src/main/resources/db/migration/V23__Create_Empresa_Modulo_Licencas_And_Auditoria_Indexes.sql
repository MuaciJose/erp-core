CREATE TABLE IF NOT EXISTS empresa_modulo_licencas (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    modulo VARCHAR(80) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    observacao VARCHAR(500),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120),
    CONSTRAINT uk_empresa_modulo_licenca UNIQUE (empresa_id, modulo),
    CONSTRAINT fk_empresa_modulo_licenca_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id)
);

CREATE INDEX IF NOT EXISTS idx_empresa_modulo_licenca_empresa
    ON empresa_modulo_licencas (empresa_id);

CREATE INDEX IF NOT EXISTS idx_empresa_modulo_licenca_modulo
    ON empresa_modulo_licencas (modulo);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_empresa_data
    ON logs_auditoria (empresa_id, data_hora DESC);

ALTER TABLE empresa_modulo_licencas
    ADD COLUMN IF NOT EXISTS valor_mensal_extra NUMERIC(12,2) DEFAULT 0;

ALTER TABLE empresa_modulo_licencas
    ADD COLUMN IF NOT EXISTS trial_ate DATE;

ALTER TABLE empresa_modulo_licencas
    ADD COLUMN IF NOT EXISTS bloqueado_comercial BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE empresa_modulo_licencas
    ADD COLUMN IF NOT EXISTS motivo_bloqueio_comercial VARCHAR(500);
