CREATE TABLE IF NOT EXISTS empresa_incidentes (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    severidade VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    responsavel VARCHAR(120),
    prazo_resposta DATE,
    prazo_resolucao DATE,
    descricao TEXT,
    resolucao TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120),
    updated_by VARCHAR(120),
    CONSTRAINT fk_empresa_incidente_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id)
);

CREATE INDEX IF NOT EXISTS idx_empresa_incidente_empresa
    ON empresa_incidentes (empresa_id);

CREATE INDEX IF NOT EXISTS idx_empresa_incidente_status
    ON empresa_incidentes (status);

CREATE INDEX IF NOT EXISTS idx_empresa_incidente_prazo
    ON empresa_incidentes (prazo_resolucao);
