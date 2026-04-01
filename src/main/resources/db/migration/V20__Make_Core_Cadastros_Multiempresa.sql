-- Remove unicidades globais remanescentes em cadastros multiempresa
-- e passa a garantir unicidade dentro de cada tenant.

ALTER TABLE categorias
    DROP CONSTRAINT IF EXISTS categorias_nome_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_categorias_empresa_nome'
    ) THEN
        ALTER TABLE categorias
            ADD CONSTRAINT uq_categorias_empresa_nome UNIQUE (empresa_id, nome);
    END IF;
END $$;

ALTER TABLE marcas
    DROP CONSTRAINT IF EXISTS marcas_nome_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_marcas_empresa_nome'
    ) THEN
        ALTER TABLE marcas
            ADD CONSTRAINT uq_marcas_empresa_nome UNIQUE (empresa_id, nome);
    END IF;
END $$;

ALTER TABLE produtos
    DROP CONSTRAINT IF EXISTS produtos_sku_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_produtos_empresa_sku'
    ) THEN
        ALTER TABLE produtos
            ADD CONSTRAINT uq_produtos_empresa_sku UNIQUE (empresa_id, sku);
    END IF;
END $$;

ALTER TABLE veiculos
    DROP CONSTRAINT IF EXISTS veiculos_placa_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_veiculos_empresa_placa'
    ) THEN
        ALTER TABLE veiculos
            ADD CONSTRAINT uq_veiculos_empresa_placa UNIQUE (empresa_id, placa);
    END IF;
END $$;

ALTER TABLE servicos_catalogo
    DROP CONSTRAINT IF EXISTS servicos_catalogo_codigo_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_servicos_empresa_codigo'
    ) THEN
        ALTER TABLE servicos_catalogo
            ADD CONSTRAINT uq_servicos_empresa_codigo UNIQUE (empresa_id, codigo);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categorias_empresa_nome ON categorias (empresa_id, nome);
CREATE INDEX IF NOT EXISTS idx_marcas_empresa_nome ON marcas (empresa_id, nome);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_sku ON produtos (empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_veiculos_empresa_placa ON veiculos (empresa_id, placa);
CREATE INDEX IF NOT EXISTS idx_servicos_empresa_codigo ON servicos_catalogo (empresa_id, codigo);
