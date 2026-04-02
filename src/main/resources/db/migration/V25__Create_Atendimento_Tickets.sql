CREATE TABLE atendimento_tickets (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    prioridade VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    cliente_nome VARCHAR(160),
    plataforma_responsavel VARCHAR(160),
    ultima_mensagem_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP
);

CREATE INDEX idx_atendimento_tickets_empresa ON atendimento_tickets(empresa_id);
CREATE INDEX idx_atendimento_tickets_status ON atendimento_tickets(status);
CREATE INDEX idx_atendimento_tickets_updated ON atendimento_tickets(updated_at DESC);

CREATE TABLE atendimento_mensagens (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    autor_tipo VARCHAR(40) NOT NULL,
    autor_nome VARCHAR(160) NOT NULL,
    mensagem TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_atendimento_mensagens_ticket ON atendimento_mensagens(ticket_id, created_at);
CREATE INDEX idx_atendimento_mensagens_empresa ON atendimento_mensagens(empresa_id);
