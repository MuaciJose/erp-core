-- Solta vínculos antigos e qualquer tentativa parcial da FK nova antes de trocar a PK de ncms.
ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS produtos_ncm_id_fkey;

ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS produtos_ncm_codigo_fkey;

ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS fk60mp7c9108gorvs12m95pjq84;

-- Introduz um id surrogate para permitir NCM por empresa sem colisão global em "codigo".
ALTER TABLE ncms
    ADD COLUMN IF NOT EXISTS id BIGSERIAL;

UPDATE ncms
SET id = DEFAULT
WHERE id IS NULL;

ALTER TABLE ncms
    DROP CONSTRAINT IF EXISTS ncms_pkey;

ALTER TABLE ncms
    ADD CONSTRAINT ncms_pkey PRIMARY KEY (id);

-- Garante unicidade apenas dentro da empresa.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_ncms_empresa_codigo'
    ) THEN
        ALTER TABLE ncms
            ADD CONSTRAINT uq_ncms_empresa_codigo UNIQUE (empresa_id, codigo);
    END IF;
END $$;

-- Nova relação Produto -> Ncm por id.
ALTER TABLE produtos
    ADD COLUMN IF NOT EXISTS ncm_id BIGINT;

-- O legado exigia ncm_codigo preenchido, mas a aplicação nova persiste apenas ncm_id.
ALTER TABLE produtos
    ALTER COLUMN ncm_codigo DROP NOT NULL;

UPDATE produtos p
SET ncm_id = n.id
FROM ncms n
WHERE p.ncm_codigo = n.codigo
  AND p.empresa_id = n.empresa_id
  AND p.ncm_id IS NULL;

UPDATE produtos p
SET ncm_id = n.id
FROM ncms n
WHERE p.ncm_codigo = n.codigo
  AND p.ncm_id IS NULL;

-- Recria a FK apenas se ainda não existir.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'produtos_ncm_id_fkey'
    ) THEN
        ALTER TABLE produtos
            ADD CONSTRAINT produtos_ncm_id_fkey
                FOREIGN KEY (ncm_id) REFERENCES ncms(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ncms_empresa_codigo ON ncms (empresa_id, codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm_id ON produtos (ncm_id);
