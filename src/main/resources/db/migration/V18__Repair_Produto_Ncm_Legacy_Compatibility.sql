-- Saneia a transição Produto -> Ncm por id sem quebrar integrações legadas que ainda leem ncm_codigo.

-- Garante que o legado não volte a bloquear inserts da aplicação nova.
ALTER TABLE produtos
    ALTER COLUMN ncm_codigo DROP NOT NULL;

-- Derruba vínculos antigos remanescentes para ncm_codigo, se ainda existirem.
ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS produtos_ncm_codigo_fkey;

ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS fk60mp7c9108gorvs12m95pjq84;

-- Preenche ncm_id para registros antigos que ainda só tenham ncm_codigo.
UPDATE produtos p
SET ncm_id = n.id
FROM ncms n
WHERE p.ncm_id IS NULL
  AND p.ncm_codigo IS NOT NULL
  AND p.ncm_codigo = n.codigo
  AND p.empresa_id = n.empresa_id;

UPDATE produtos p
SET ncm_id = n.id
FROM ncms n
WHERE p.ncm_id IS NULL
  AND p.ncm_codigo IS NOT NULL
  AND p.ncm_codigo = n.codigo;

-- Reidrata ncm_codigo para relatórios/consultas legadas quando o vínculo novo já existir.
UPDATE produtos p
SET ncm_codigo = n.codigo
FROM ncms n
WHERE p.ncm_id = n.id
  AND (p.ncm_codigo IS NULL OR p.ncm_codigo = '');

-- Garante a FK nova caso a base tenha sido migrada manualmente de forma incompleta.
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

CREATE INDEX IF NOT EXISTS idx_produtos_ncm_codigo ON produtos (ncm_codigo);
