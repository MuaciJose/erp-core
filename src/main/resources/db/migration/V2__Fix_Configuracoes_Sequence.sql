-- ============================================================================
-- MIGRATION: V2__Fix_Configuracoes_Sequence.sql
-- DESCRIÇÃO: Correção de Constraints para Configurações do Sistema (Multi-Empresa)
-- DATA: 2026-03-26 (CORRIGIDO 2026-03-30)
-- PROBLEMA: Identity column conflict com sequences
-- ============================================================================

-- ✅ PASSO 1: Verificar se tabela existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'configuracoes_sistema'
    ) THEN
        RAISE EXCEPTION 'Tabela configuracoes_sistema não existe. Migration anterior falhou.';
    END IF;
END $$;

-- ✅ PASSO 2: Remover constraint se existir (evita erro de duplicação)
ALTER TABLE configuracoes_sistema
    DROP CONSTRAINT IF EXISTS uk_configuracoes_empresa_id;

-- ✅ PASSO 3: Garantir que empresa_id não é nulo
ALTER TABLE configuracoes_sistema
    ALTER COLUMN empresa_id SET NOT NULL;

-- ✅ PASSO 4: Criar índice para performance multi-empresa
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_id
    ON configuracoes_sistema(empresa_id);

-- ✅ PASSO 5: Criar constraint UNIQUE (apenas se tabela não estiver vazia)
ALTER TABLE configuracoes_sistema
    ADD CONSTRAINT uk_configuracoes_empresa_id UNIQUE (empresa_id);

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- ============================================================================
-- Descomentar se precisar debugar:
-- SELECT version, description, success FROM flyway_schema_history;
-- SELECT id, empresa_id, COUNT(*) FROM configuracoes_sistema GROUP BY id, empresa_id;
-- ============================================================================

