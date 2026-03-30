-- ============================================================================
-- MIGRATION: V4__Ensure_ContaBancaria_Soft_Delete_Columns.sql
-- DESCRICAO: Garantir colunas de soft delete em contas_bancarias
-- DATA: 2026-03-30
-- PROPOSITO: Corrigir bases existentes onde a V3 nao foi aplicada
-- ============================================================================

ALTER TABLE contas_bancarias
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN;

UPDATE contas_bancarias
SET ativo = TRUE
WHERE ativo IS NULL;

ALTER TABLE contas_bancarias
    ALTER COLUMN ativo SET DEFAULT TRUE;

ALTER TABLE contas_bancarias
    ALTER COLUMN ativo SET NOT NULL;

ALTER TABLE contas_bancarias
    ADD COLUMN IF NOT EXISTS data_delecao TIMESTAMP NULL;

ALTER TABLE contas_bancarias
    ADD COLUMN IF NOT EXISTS usuario_delecao VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo
    ON contas_bancarias(ativo, empresa_id);
