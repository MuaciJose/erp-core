CREATE TABLE atendimento_templates (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(120)
);

CREATE INDEX idx_atendimento_templates_updated ON atendimento_templates(updated_at DESC);
