CREATE TABLE IF NOT EXISTS agenda_compromissos (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(30) NOT NULL DEFAULT 'COMPROMISSO',
    setor VARCHAR(30) NOT NULL DEFAULT 'ADMINISTRATIVO',
    prioridade VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADO',
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    parceiro_id BIGINT,
    parceiro_nome VARCHAR(255),
    veiculo_id BIGINT,
    veiculo_placa VARCHAR(20),
    veiculo_descricao VARCHAR(255),
    usuario_responsavel_id BIGINT,
    usuario_responsavel_nome VARCHAR(255),
    origem_modulo VARCHAR(80),
    origem_id BIGINT,
    lembrete_whats_app BOOLEAN NOT NULL DEFAULT FALSE,
    observacao_interna TEXT,
    concluido_em TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_compromissos_empresa_data
    ON agenda_compromissos (empresa_id, data_inicio);

CREATE INDEX IF NOT EXISTS idx_agenda_compromissos_empresa_status
    ON agenda_compromissos (empresa_id, status);
