# 🗄️ DIAGNÓSTICO E SCRIPTS SQL - MULTI-EMPRESA

## 🔍 PARTE 1: DIAGNÓSTICO RÁPIDO

Execute estes comandos para diagnosticar sua situação atual:

```sql
-- ========================================================================
-- 1️⃣ VERIFICAR ESTRUTURA: Todas as tabelas têm empresa_id?
-- ========================================================================

SELECT
    table_name,
    CASE WHEN column_name = 'empresa_id' THEN '✅ SIM' ELSE '❌ NÃO' END as tem_empresa_id
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'produtos', 'vendas', 'notas_fiscais', 'movimentacoes_estoque',
    'itens_venda', 'contas', 'movimentacoes_caixa', 'logs_auditoria'
  )
ORDER BY table_name;

-- RESULTADO ESPERADO:
-- ┌─────────────────────┬───────────────┐
-- │ table_name          │ tem_empresa_id│
-- ├─────────────────────┼───────────────┤
-- │ contas              │ ✅ SIM        │
-- │ itens_venda         │ ✅ SIM        │
-- │ logs_auditoria      │ ✅ SIM        │
-- │ movimentacoes_caixa │ ✅ SIM        │
-- │ movimentacoes_...   │ ✅ SIM        │
-- │ notas_fiscais       │ ✅ SIM        │
-- │ produtos            │ ✅ SIM        │
-- │ vendas              │ ✅ SIM        │
-- └─────────────────────┴───────────────┘

-- Se tiver ❌ NÃO, precisa adicionar:
-- ALTER TABLE [tabela] ADD COLUMN empresa_id BIGINT NOT NULL DEFAULT 1;
```

---

```sql
-- ========================================================================
-- 2️⃣ VERIFICAR DISTRIBUIÇÃO: Dados estão segregados por empresa?
-- ========================================================================

-- Contagem por empresa
SELECT 'Produtos' as tabela, empresa_id, COUNT(*) as total
FROM produtos GROUP BY empresa_id
UNION ALL
SELECT 'Vendas', empresa_id, COUNT(*)
FROM vendas GROUP BY empresa_id
UNION ALL
SELECT 'Notas Fiscais', empresa_id, COUNT(*)
FROM notas_fiscais GROUP BY empresa_id
UNION ALL
SELECT 'Movimentações Estoque', empresa_id, COUNT(*)
FROM movimentacoes_estoque GROUP BY empresa_id
ORDER BY tabela, empresa_id;

-- RESULTADO ESPERADO (exemplo):
-- ┌─────────────────────┬────────────┬───────┐
-- │ tabela              │ empresa_id │ total │
-- ├─────────────────────┼────────────┼───────┤
-- │ Movimentações...    │ 1          │ 150   │
-- │ Notas Fiscais       │ 1          │ 89    │
-- │ Notas Fiscais       │ 2          │ 45    │
-- │ Produtos            │ 1          │ 250   │
-- │ Produtos            │ 2          │ 180   │
-- │ Vendas              │ 1          │ 520   │
-- │ Vendas              │ 2          │ 310   │
-- └─────────────────────┴────────────┴───────┘
```

---

```sql
-- ========================================================================
-- 3️⃣ VERIFICAR ISOLAMENTO: Há dados com empresa_id nulo ou inválido?
-- ========================================================================

-- Produtos com empresa_id nulo
SELECT 'Produtos COM NULO' as tabela, COUNT(*) as total FROM produtos WHERE empresa_id IS NULL
UNION ALL
-- Vendas com empresa_id nulo
SELECT 'Vendas COM NULO', COUNT(*) FROM vendas WHERE empresa_id IS NULL
UNION ALL
-- Notas Fiscais com empresa_id nulo
SELECT 'Notas Fiscais COM NULO', COUNT(*) FROM notas_fiscais WHERE empresa_id IS NULL
UNION ALL
-- Produtos com empresa_id inválido (não existe em empresas tabela)
SELECT 'Produtos COM EMPRESA INVÁLIDA', COUNT(*)
FROM produtos p
WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = p.empresa_id);

-- RESULTADO ESPERADO:
-- Tudo retorna 0 (zero)!
-- Se tiver valores > 0, você tem um vazamento de dados!
```

---

```sql
-- ========================================================================
-- 4️⃣ VERIFICAR PERFORMANCE: Há índices em empresa_id?
-- ========================================================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%empresa%' OR indexdef LIKE '%empresa_id%')
ORDER BY tablename;

-- RESULTADO ESPERADO:
-- Deve aparecer índices como:
-- idx_produtos_empresa_id
-- idx_vendas_empresa_id
-- etc.

-- Se estiver vazio, CRIE OS ÍNDICES:
CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX idx_vendas_empresa_id ON vendas(empresa_id);
CREATE INDEX idx_notas_fiscais_empresa_id ON notas_fiscais(empresa_id);
CREATE INDEX idx_movimentacoes_estoque_empresa_id ON movimentacoes_estoque(empresa_id);
CREATE INDEX idx_itens_venda_empresa_id ON itens_venda(empresa_id);
CREATE INDEX idx_contas_empresa_id ON contas(empresa_id);
CREATE INDEX idx_movimentacoes_caixa_empresa_id ON movimentacoes_caixa(empresa_id);
CREATE INDEX idx_logs_auditoria_empresa_id ON logs_auditoria(empresa_id);
```

---

```sql
-- ========================================================================
-- 5️⃣ VERIFICAR USUÁRIOS: Cada usuário está atribuído a uma empresa?
-- ========================================================================

SELECT
    id,
    username,
    nome_completo,
    empresa_id,
    ativo,
    CASE WHEN empresa_id IS NULL THEN '⚠️ SEM EMPRESA'
         WHEN empresa_id = 0 THEN '⚠️ EMPRESA 0'
         ELSE '✅ OK' END as status
FROM usuarios
ORDER BY empresa_id, username;

-- RESULTADO ESPERADO:
-- ┌────┬──────────┬────────────────────┬────────────┬────────┬────────────────────┐
-- │ id │ username │ nome_completo      │ empresa_id │ ativo  │ status             │
-- ├────┼──────────┼────────────────────┼────────────┼────────┼────────────────────┤
-- │ 1  │ admin    │ Administrador      │ 1          │ true   │ ✅ OK              │
-- │ 2  │ user1    │ Usuário Empresa 1  │ 1          │ true   │ ✅ OK              │
-- │ 3  │ user2    │ Usuário Empresa 2  │ 2          │ true   │ ✅ OK              │
-- │ 4  │ vendedor │ Vendedor           │ 1          │ true   │ ✅ OK              │
-- └────┴──────────┴────────────────────┴────────────┴────────┴────────────────────┘
```

---

## 🛠️ PARTE 2: SCRIPTS DE CORREÇÃO

### 🟥 Se encontrou problemas no diagnóstico, execute estes scripts:

```sql
-- ========================================================================
-- CORRIGIR: Adicionar empresa_id em tabelas que faltam
-- ========================================================================

-- ⚠️ CUIDADO: Backup first!
-- mysqldump -u usuario -p banco > backup_antes_correcao.sql

-- Adicionar coluna se não existir
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE itens_venda
ADD COLUMN IF NOT EXISTS empresa_id BIGINT NOT NULL DEFAULT 1;

-- Adicionar constraint de chave estrangeira
ALTER TABLE produtos
ADD CONSTRAINT fk_produtos_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

ALTER TABLE vendas
ADD CONSTRAINT fk_vendas_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

ALTER TABLE notas_fiscais
ADD CONSTRAINT fk_notas_fiscais_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
```

---

```sql
-- ========================================================================
-- CORRIGIR: Limpar dados órfãos (produtos/vendas sem empresa válida)
-- ========================================================================

-- Encontrar registros órfãos
SELECT p.* FROM produtos p
WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = p.empresa_id);

-- Deletar registros órfãos (⚠️ CUIDADO!)
DELETE FROM produtos p
WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = p.empresa_id);

-- Mesmo para outras tabelas
DELETE FROM vendas v
WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = v.empresa_id);

DELETE FROM notas_fiscais nf
WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = nf.empresa_id);
```

---

```sql
-- ========================================================================
-- CORRIGIR: Reassignar usuários sem empresa
-- ========================================================================

-- Listar usuários sem empresa
SELECT * FROM usuarios WHERE empresa_id IS NULL OR empresa_id = 0;

-- Atribuir a empresa 1 (ou a empresa padrão)
UPDATE usuarios
SET empresa_id = 1
WHERE empresa_id IS NULL OR empresa_id = 0;

-- Verificar resultado
SELECT id, username, empresa_id FROM usuarios;
```

---

```sql
-- ========================================================================
-- OTIMIZAR: Criar índices para melhorar performance
-- ========================================================================

-- Índices em empresa_id
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id ON notas_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_empresa_id ON movimentacoes_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_empresa_id ON itens_venda(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_empresa_id ON contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa_id ON movimentacoes_caixa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

-- Índices compostos (empresa + campo importante)
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_sku ON produtos(empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_status ON vendas(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_status ON notas_fiscais(empresa_id, status);

-- Analisar queries
ANALYZE;
```

---

## 📊 PARTE 3: RELATÓRIOS DE MONITORAMENTO

```sql
-- ========================================================================
-- RELATÓRIO 1: Visão geral de dados por empresa
-- ========================================================================

WITH dados AS (
    SELECT 'Produtos' as recurso, empresa_id, COUNT(*) as total FROM produtos GROUP BY empresa_id
    UNION ALL
    SELECT 'Vendas', empresa_id, COUNT(*) FROM vendas GROUP BY empresa_id
    UNION ALL
    SELECT 'Notas Fiscais', empresa_id, COUNT(*) FROM notas_fiscais GROUP BY empresa_id
    UNION ALL
    SELECT 'Movimentações Est.', empresa_id, COUNT(*) FROM movimentacoes_estoque GROUP BY empresa_id
    UNION ALL
    SELECT 'Usuários', empresa_id, COUNT(*) FROM usuarios GROUP BY empresa_id
)
SELECT
    recurso,
    empresa_id,
    total,
    ROUND(total::numeric / SUM(total) OVER (PARTITION BY recurso) * 100, 2) as percentual
FROM dados
ORDER BY recurso, empresa_id;
```

---

```sql
-- ========================================================================
-- RELATÓRIO 2: Performance de sincronização por empresa
-- ========================================================================

SELECT
    v.empresa_id,
    COUNT(v.id) as total_vendas,
    COUNT(CASE WHEN v.status = 'CONCLUIDA' THEN 1 END) as vendas_concluidas,
    COUNT(CASE WHEN v.status = 'CANCELADA' THEN 1 END) as vendas_canceladas,
    COUNT(CASE WHEN nf.id IS NOT NULL THEN 1 END) as com_nf,
    ROUND(COUNT(CASE WHEN nf.id IS NOT NULL THEN 1 END)::numeric / COUNT(v.id) * 100, 2) as percentual_nf
FROM vendas v
LEFT JOIN notas_fiscais nf ON v.id = nf.venda_id
GROUP BY v.empresa_id
ORDER BY v.empresa_id;
```

---

```sql
-- ========================================================================
-- RELATÓRIO 3: Produtos compartilhados entre empresas
-- ========================================================================

SELECT
    sku,
    nome,
    COUNT(DISTINCT empresa_id) as total_empresas,
    STRING_AGG(DISTINCT empresa_id::text, ', ' ORDER BY empresa_id::text) as empresas,
    STRING_AGG(DISTINCT referencia_original, ', ') as referencias
FROM produtos
WHERE referencia_original IS NOT NULL
GROUP BY sku, nome
HAVING COUNT(DISTINCT empresa_id) > 1
ORDER BY total_empresas DESC;
```

---

```sql
-- ========================================================================
-- RELATÓRIO 4: Segurança - Verificar isolamento
-- ========================================================================

-- Criar view para monitorar segurança
CREATE OR REPLACE VIEW v_seguranca_multiempresa AS
SELECT
    'Produtos' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END) as registros_sem_empresa,
    COUNT(DISTINCT empresa_id) as total_empresas,
    (SELECT COUNT(*) FROM empresas) as empresas_ativas
FROM produtos
UNION ALL
SELECT 'Vendas', COUNT(*), COUNT(CASE WHEN empresa_id IS NULL THEN 1 END),
    COUNT(DISTINCT empresa_id), (SELECT COUNT(*) FROM empresas)
FROM vendas
UNION ALL
SELECT 'Notas Fiscais', COUNT(*), COUNT(CASE WHEN empresa_id IS NULL THEN 1 END),
    COUNT(DISTINCT empresa_id), (SELECT COUNT(*) FROM empresas)
FROM notas_fiscais;

-- Usar view
SELECT * FROM v_seguranca_multiempresa;
```

---

## 🧪 PARTE 4: TESTES DE ISOLAMENTO

```sql
-- ========================================================================
-- TESTE 1: Simular usuário da Empresa 1
-- ========================================================================

-- Valor para simular (use em seu código Java)
SET search_path TO public;
-- Em Java: SecurityContextHolder.getContext().getAuthentication().getPrincipal().getEmpresaId() = 1

-- Consulta que JPA faria
SELECT * FROM produtos WHERE empresa_id = 1;
SELECT * FROM vendas WHERE empresa_id = 1;

-- ESPERADO: Apenas dados da empresa 1
```

---

```sql
-- ========================================================================
-- TESTE 2: Simular usuário da Empresa 2
-- ========================================================================

-- Valor para simular
-- Em Java: empresaId = 2

SELECT * FROM produtos WHERE empresa_id = 2;
SELECT * FROM vendas WHERE empresa_id = 2;

-- ESPERADO: Apenas dados da empresa 2 (COMPLETAMENTE diferente de empresa 1!)
```

---

```sql
-- ========================================================================
-- TESTE 3: Simular falha de TenantId (DEFAULT 1L)
-- ========================================================================

-- Se alguém desabilitar TenantId, o que aconteceria?
-- Sem WHERE empresa_id, retorna TUDO:

SELECT COUNT(*) as total FROM produtos;  -- Deve ser total_empresa_1 + total_empresa_2
SELECT COUNT(*) as total FROM vendas;    -- Deve ser soma de todas

-- Agora WITH filtro:
SELECT COUNT(*) as total_empresa_1 FROM produtos WHERE empresa_id = 1;
SELECT COUNT(*) as total_empresa_2 FROM produtos WHERE empresa_id = 2;

-- ESPERADO: total ≠ total_empresa_1 + total_empresa_2 se houver múltiplas empresas
```

---

## 🚨 PARTE 5: ALERTAS E MONITORAMENTO CONTÍNUO

```sql
-- ========================================================================
-- CRIAR ALERT: Registros sem empresa_id
-- ========================================================================

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS alertas_seguranca (
    id SERIAL PRIMARY KEY,
    tipo_alerta VARCHAR(100),
    tabela_afetada VARCHAR(50),
    total_registros INT,
    data_alerta TIMESTAMP DEFAULT NOW(),
    resolvido BOOLEAN DEFAULT FALSE
);

-- Função que dispara alerta
CREATE OR REPLACE FUNCTION verificar_isolamento_dados() RETURNS void AS $$
BEGIN
    -- Verificar produtos
    IF (SELECT COUNT(*) FROM produtos WHERE empresa_id IS NULL) > 0 THEN
        INSERT INTO alertas_seguranca (tipo_alerta, tabela_afetada, total_registros)
        SELECT 'DADOS_SEM_EMPRESA', 'produtos', COUNT(*) FROM produtos WHERE empresa_id IS NULL;
    END IF;

    -- Verificar vendas
    IF (SELECT COUNT(*) FROM vendas WHERE empresa_id IS NULL) > 0 THEN
        INSERT INTO alertas_seguranca (tipo_alerta, tabela_afetada, total_registros)
        SELECT 'DADOS_SEM_EMPRESA', 'vendas', COUNT(*) FROM vendas WHERE empresa_id IS NULL;
    END IF;

    -- Mais verificações...
END;
$$ LANGUAGE plpgsql;

-- Executar função diariamente
-- (Configurar em seu job scheduler ou cron)
-- SELECT verificar_isolamento_dados();
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

```
DIAGNÓSTICO
[ ] Executar script 1️⃣ (Estrutura)
[ ] Executar script 2️⃣ (Distribuição)
[ ] Executar script 3️⃣ (Isolamento)
[ ] Executar script 4️⃣ (Performance)
[ ] Executar script 5️⃣ (Usuários)

CORREÇÃO
[ ] Se necessário, executar scripts de CORREÇÃO
[ ] Validar depois da correção
[ ] Backup antes de cada alteração

OTIMIZAÇÃO
[ ] Executar scripts de ÍNDICES
[ ] Analisar plans das queries
[ ] Monitorar performance

MONITORAMENTO
[ ] Criar views de monitoramento
[ ] Testar isolamento (parte 4)
[ ] Ativar alertas (parte 5)
```

---

**Gerado em**: 2026-03-24
**Versão PostgreSQL Testada**: 12+
**Compatibilidade**: MySQL também funciona (ajustar sintaxe)

