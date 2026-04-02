CREATE TABLE IF NOT EXISTS empresa_cadastro_complementar (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL UNIQUE,
    status_onboarding VARCHAR(40) NOT NULL DEFAULT 'PENDENTE_COMPLEMENTO',
    prazo_conclusao DATE,
    concluido_em TIMESTAMP,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(120),
    inscricao_municipal VARCHAR(120),
    regime_tributario VARCHAR(120),
    website VARCHAR(255),
    cep VARCHAR(20),
    logradouro VARCHAR(255),
    numero VARCHAR(60),
    complemento VARCHAR(255),
    bairro VARCHAR(120),
    cidade VARCHAR(120),
    uf VARCHAR(2),
    responsavel_financeiro_nome VARCHAR(255),
    responsavel_financeiro_email VARCHAR(255),
    responsavel_financeiro_telefone VARCHAR(40),
    responsavel_operacional_nome VARCHAR(255),
    responsavel_operacional_email VARCHAR(255),
    responsavel_operacional_telefone VARCHAR(40),
    aceite_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresa_cadastro_complementar_empresa
    ON empresa_cadastro_complementar (empresa_id);
