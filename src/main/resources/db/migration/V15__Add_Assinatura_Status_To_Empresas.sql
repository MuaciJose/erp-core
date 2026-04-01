ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS status_assinatura VARCHAR(30) NOT NULL DEFAULT 'ATIVA',
    ADD COLUMN IF NOT EXISTS data_vencimento DATE,
    ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;

UPDATE empresas
SET status_assinatura = COALESCE(status_assinatura, 'ATIVA')
WHERE status_assinatura IS NULL;

UPDATE empresas
SET data_vencimento = COALESCE(data_vencimento, CURRENT_DATE + 30)
WHERE data_vencimento IS NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_status_assinatura ON empresas (status_assinatura);
CREATE INDEX IF NOT EXISTS idx_empresas_data_vencimento ON empresas (data_vencimento);
