ALTER TABLE atendimento_tickets
    ADD COLUMN incidente_id BIGINT;

CREATE INDEX idx_atendimento_tickets_incidente ON atendimento_tickets(incidente_id);
