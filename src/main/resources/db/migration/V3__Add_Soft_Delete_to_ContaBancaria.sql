-- ============================================================================
-- MIGRATION: V3__Add_Soft_Delete_to_ContaBancaria.sql
-- DESCRIÇÃO: Adicionar colunas de Soft Delete à tabela contas_bancarias
-- DATA: 2026-03-30
-- PROPÓSITO: Permitir auditoria e rastreamento de deleções
-- ============================================================================

-- ✅ PASSO 1: Adicionar coluna "ativo" (booleano, padrão TRUE)
ALTER TABLE contas_bancarias
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- ✅ PASSO 2: Adicionar coluna "data_delecao" (timestamp, nullable)
ALTER TABLE contas_bancarias
ADD COLUMN IF NOT EXISTS data_delecao TIMESTAMP NULL;

-- ✅ PASSO 3: Adicionar coluna "usuario_delecao" (VARCHAR 255, nullable)
ALTER TABLE contas_bancarias
ADD COLUMN IF NOT EXISTS usuario_delecao VARCHAR(255) NULL;

-- ✅ PASSO 4: Criar índice para performance em queries de soft delete
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo
ON contas_bancarias(ativo, empresa_id);

-- ✅ PASSO 5: Comentários para documentação
COMMENT ON COLUMN contas_bancarias.ativo IS 'TRUE = ativa, FALSE = deletada (soft delete)';
COMMENT ON COLUMN contas_bancarias.data_delecao IS 'Data/hora quando foi deletada via soft delete';
COMMENT ON COLUMN contas_bancarias.usuario_delecao IS 'Usuário que realizou a deleção';

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRATION (comentadas)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'contas_bancarias' ORDER BY ordinal_position;
--
-- SELECT * FROM contas_bancarias WHERE ativo = FALSE;
-- ============================================================================

