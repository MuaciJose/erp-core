CREATE TABLE IF NOT EXISTS assinatura_cobrancas (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id),
    referencia VARCHAR(80) NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    gateway_nome VARCHAR(50),
    gateway_cobranca_id VARCHAR(120),
    external_reference VARCHAR(120),
    payment_link VARCHAR(1000),
    descricao VARCHAR(500),
    observacoes TEXT,
    paid_at TIMESTAMP,
    last_webhook_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cobranca_webhook_eventos (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT REFERENCES empresas(id),
    cobranca_id BIGINT REFERENCES assinatura_cobrancas(id),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    external_event_id VARCHAR(120),
    payload_json TEXT,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assinatura_cobrancas_empresa ON assinatura_cobrancas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_cobrancas_status ON assinatura_cobrancas (status);
CREATE INDEX IF NOT EXISTS idx_assinatura_cobrancas_gateway ON assinatura_cobrancas (gateway_nome, gateway_cobranca_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_webhook_provider_event ON cobranca_webhook_eventos (provider, external_event_id);
