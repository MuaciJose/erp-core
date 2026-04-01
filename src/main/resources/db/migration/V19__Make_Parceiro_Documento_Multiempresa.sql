-- Parceiros são multiempresa: o mesmo CPF/CNPJ pode existir em tenants diferentes.

ALTER TABLE parceiros
    DROP CONSTRAINT IF EXISTS parceiros_documento_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_parceiros_empresa_documento'
    ) THEN
        ALTER TABLE parceiros
            ADD CONSTRAINT uq_parceiros_empresa_documento UNIQUE (empresa_id, documento);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_parceiros_empresa_documento ON parceiros (empresa_id, documento);
CREATE INDEX IF NOT EXISTS idx_parceiros_empresa_nome ON parceiros (empresa_id, nome);
