CREATE TABLE IF NOT EXISTS assinatura_invites (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(120) NOT NULL UNIQUE,
    email_destino VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_assinatura_invites_email ON assinatura_invites (email_destino);
CREATE INDEX IF NOT EXISTS idx_assinatura_invites_expires ON assinatura_invites (expires_at);

CREATE TABLE IF NOT EXISTS solicitacoes_acesso (
    id BIGSERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(30) NOT NULL,
    telefone VARCHAR(40) NOT NULL,
    nome_contato VARCHAR(255) NOT NULL,
    email_contato VARCHAR(255) NOT NULL,
    observacoes TEXT,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_acesso_cnpj ON solicitacoes_acesso (cnpj);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_acesso_status ON solicitacoes_acesso (status);
