-- ============================================================================
-- MIGRATION: V2__Fix_Configuracoes_Sequence.sql
-- DESCRIÇÃO: Correção de Constraints para Configurações do Sistema (Multi-Empresa)
-- DATA: 2026-03-26
-- PROBLEMA: "id = null" violating not-null constraint
-- ============================================================================

-- 🔴 PASSO 1: Garantir que empresa_id não é nulo (multi-tenant requirement)
ALTER TABLE configuracoes_sistema
    ALTER COLUMN empresa_id SET NOT NULL;

-- 🔴 PASSO 2: Criar índice para melhor performance em queries multi-empresa
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_id
    ON configuracoes_sistema(empresa_id);

-- 🔴 PASSO 3: Criar constraint UNIQUE para garantir uma configuração por empresa
-- Primeiro, remover se existir
ALTER TABLE configuracoes_sistema
    DROP CONSTRAINT IF EXISTS uk_configuracoes_empresa_id;

-- Depois, criar a constraint
ALTER TABLE configuracoes_sistema
    ADD CONSTRAINT uk_configuracoes_empresa_id UNIQUE (empresa_id);

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRATION (Comentadas - execute manualmente se necessário)
-- ============================================================================
-- SELECT version, description, success FROM flyway_schema_history;
-- SELECT id, empresa_id FROM configuracoes_sistema;
-- ============================================================================

