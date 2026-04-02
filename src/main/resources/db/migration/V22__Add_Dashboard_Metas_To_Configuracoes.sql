ALTER TABLE configuracoes_sistema
    ADD COLUMN IF NOT EXISTS meta_faturamento_periodo NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_pedidos_periodo INTEGER DEFAULT 0;
