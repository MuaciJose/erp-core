-- ============================================================================
-- MIGRATION: V5__Add_Extrato_Financeiro_Layouts.sql
-- DESCRICAO: Adicionar layouts HTML de extrato financeiro nas configuracoes
-- DATA: 2026-03-30
-- PROPOSITO: Governar em Flyway as colunas usadas pelos extratos financeiros
-- ============================================================================

ALTER TABLE configuracoes_sistema
    ADD COLUMN IF NOT EXISTS layout_html_extrato_cliente TEXT;

ALTER TABLE configuracoes_sistema
    ADD COLUMN IF NOT EXISTS layout_html_extrato_fornecedor TEXT;

CREATE INDEX IF NOT EXISTS idx_contas_receber_parceiro
    ON contas_receber(parceiro_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_parceiro
    ON contas_pagar(parceiro_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento
    ON contas_receber(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento
    ON contas_pagar(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_receber_status
    ON contas_receber(status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status
    ON contas_pagar(status);

CREATE INDEX IF NOT EXISTS idx_contas_receber_composto
    ON contas_receber(parceiro_id, status, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_composto
    ON contas_pagar(parceiro_id, status, data_vencimento);
