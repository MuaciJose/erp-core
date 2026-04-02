ALTER TABLE empresa_cadastro_complementar
    ADD COLUMN IF NOT EXISTS liberacao_manual_ativa BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liberacao_manual_em TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS liberacao_manual_por VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS liberacao_manual_motivo TEXT NULL;
