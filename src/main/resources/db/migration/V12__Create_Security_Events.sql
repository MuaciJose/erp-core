CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT,
    data_hora TIMESTAMP NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    severidade VARCHAR(20) NOT NULL,
    username VARCHAR(255),
    ip_origem VARCHAR(120),
    detalhes TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_events_data ON security_events (data_hora);
CREATE INDEX IF NOT EXISTS idx_security_events_tipo ON security_events (tipo);
CREATE INDEX IF NOT EXISTS idx_security_events_usuario ON security_events (username);
CREATE INDEX IF NOT EXISTS idx_security_events_empresa ON security_events (empresa_id);
