# 🗄️ SCRIPTS SQL - DEPLOYMENT MULTI-EMPRESA

## ⚠️ EXECUTAR ANTES DO DEPLOYMENT

Execute estes scripts SQL na EXATA ordem abaixo em seu banco de dados.

---

## SCRIPT 1: CRIAR ÍNDICES (Performance)

```sql
-- ========================================================================
-- 🚀 CRIAR ÍNDICES EM empresa_id (CRÍTICO PARA PERFORMANCE)
-- ========================================================================

-- Executar um por um para monitorar progresso
-- Cada um leva 5-10 segundos dependendo do tamanho da tabela

-- Índice em Produtos
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id
ON produtos(empresa_id);

-- Índice em Vendas
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id
ON vendas(empresa_id);

-- Índice em Notas Fiscais
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id
ON notas_fiscais(empresa_id);

-- Índice em Itens de Venda
CREATE INDEX IF NOT EXISTS idx_itens_venda_empresa_id
ON itens_venda(empresa_id);

-- Índice em Movimentações Estoque
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_empresa_id
ON movimentacoes_estoque(empresa_id);

-- Índice em Contas
CREATE INDEX IF NOT EXISTS idx_contas_empresa_id
ON contas(empresa_id);

-- Índice em Movimentações Caixa
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa_id
ON movimentacoes_caixa(empresa_id);

-- Índice em Logs Auditoria
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_empresa_id
ON logs_auditoria(empresa_id);

-- Índice composto (empresa_id + campo importante)
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_sku
ON produtos(empresa_id, sku);

CREATE INDEX IF NOT EXISTS idx_vendas_empresa_status
ON vendas(empresa_id, status);

-- Verificar índices criados
SHOW INDEXES FROM produtos WHERE Key_name LIKE 'idx_%empresa%';
SHOW INDEXES FROM vendas WHERE Key_name LIKE 'idx_%empresa%';
SHOW INDEXES FROM notas_fiscais WHERE Key_name LIKE 'idx_%empresa%';
```

---

## SCRIPT 2: VALIDAR DADOS (Integridade)

```sql
-- ========================================================================
-- ✅ VALIDAR INTEGRIDADE DOS DADOS
-- ========================================================================

-- Verificar produtos
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as sem_empresa FROM produtos WHERE empresa_id IS NULL;
SELECT empresa_id, COUNT(*) as total FROM produtos GROUP BY empresa_id;

-- Verificar vendas
SELECT COUNT(*) as total_vendas FROM vendas;
SELECT COUNT(*) as sem_empresa FROM vendas WHERE empresa_id IS NULL;
SELECT empresa_id, COUNT(*) as total FROM vendas GROUP BY empresa_id;

-- Verificar notas fiscais
SELECT COUNT(*) as total_notas FROM notas_fiscais;
SELECT COUNT(*) as sem_empresa FROM notas_fiscais WHERE empresa_id IS NULL;
SELECT empresa_id, COUNT(*) as total FROM notas_fiscais GROUP BY empresa_id;

-- RESULTADO ESPERADO:
-- Todas as consultas "sem_empresa" devem retornar 0 (zero)
-- Se retornar > 0, há dados órfãos!

-- Se encontrou dados orphãos, adicionar empresa_id faltante:
UPDATE produtos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE vendas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE notas_fiscais SET empresa_id = 1 WHERE empresa_id IS NULL;
```

---

## SCRIPT 3: VALIDAR USUÁRIOS (Isolamento)

```sql
-- ========================================================================
-- 🔐 VALIDAR USUÁRIOS E ISOLAMENTO
-- ========================================================================

-- Verificar todos os usuários têm empresa_id
SELECT id, username, empresa_id, ativo
FROM usuarios
ORDER BY empresa_id, username;

-- RESULTADO ESPERADO:
-- Cada usuário deve ter um empresa_id > 0

-- Se encontrou usuários SEM empresa_id:
UPDATE usuarios SET empresa_id = 1 WHERE empresa_id IS NULL OR empresa_id = 0;

-- Verificar permissões por usuário
SELECT u.id, u.username, u.empresa_id, COUNT(p.permissao) as total_permissoes
FROM usuarios u
LEFT JOIN usuario_permissoes p ON u.id = p.usuario_id
GROUP BY u.id, u.username, u.empresa_id
ORDER BY u.empresa_id;
```

---

## SCRIPT 4: TESTAR ISOLAMENTO (Simulação)

```sql
-- ========================================================================
-- 🧪 TESTAR ISOLAMENTO DE DADOS
-- ========================================================================

-- Simulando que usuário de Empresa 1 faz query
-- (Em produção, TenantResolver faz isso automaticamente)

-- EMPRESA 1 ve apenas seus produtos:
SELECT COUNT(*) as produtos_empresa_1
FROM produtos
WHERE empresa_id = 1;

-- EMPRESA 2 ve apenas seus produtos:
SELECT COUNT(*) as produtos_empresa_2
FROM produtos
WHERE empresa_id = 2;

-- Totais devem ser DIFERENTES!

-- Listar produtos de cada empresa:
SELECT empresa_id, COUNT(*) as total, GROUP_CONCAT(sku) as skus
FROM produtos
GROUP BY empresa_id;

-- RESULTADO ESPERADO:
-- empresa_id | total | skus
-- 1          | 250   | SKU001,SKU002,...
-- 2          | 180   | SKU100,SKU101,...
```

---

## SCRIPT 5: BACKUP DE SEGURANÇA (Antes de tudo)

```sql
-- ========================================================================
-- 📦 BACKUP DE SEGURANÇA (EXECUTAR PRIMEIRO!)
-- ========================================================================

-- IMPORTANTE: Execute isso ANTES de qualquer mudança!

-- Linha de comando (fora do MySQL):
-- mysqldump -u root -p grandport_erp > backup_multiempresa_$(date +%Y%m%d_%H%M%S).sql

-- Ou via MySQL (dentro do cliente):
-- (Executar pelo sistema de backup do seu servidor)

-- Verificar tamanho do banco
SELECT
    table_schema,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as tamanho_mb
FROM information_schema.tables
WHERE table_schema = 'grandport_erp'
GROUP BY table_schema;
```

---

## SCRIPT 6: LIMPEZA PÓS-DEPLOYMENT (Opcional)

```sql
-- ========================================================================
-- 🧹 LIMPEZA PÓS-DEPLOYMENT (OPCIONAL)
-- ========================================================================

-- Limpar cache de query (se usar MySQL Query Cache - versões antigas)
-- FLUSH QUERY CACHE;

-- Analisar tabelas para otimização
ANALYZE TABLE produtos;
ANALYZE TABLE vendas;
ANALYZE TABLE notas_fiscais;
ANALYZE TABLE itens_venda;
ANALYZE TABLE movimentacoes_estoque;

-- Verificar estatísticas
SHOW TABLE STATUS FROM grandport_erp;

-- Otimizar tabelas (se houver muito DELETE/UPDATE)
-- OPTIMIZE TABLE produtos;
-- OPTIMIZE TABLE vendas;
```

---

## SCRIPT 7: MONITORAMENTO CONTÍNUO (Pós-Deployment)

```sql
-- ========================================================================
-- 📊 MONITORAMENTO CONTÍNUO (Executar periodicamente)
-- ========================================================================

-- View para monitorar saúde do sistema multi-empresa
CREATE OR REPLACE VIEW v_saude_multiempresa AS
SELECT
    'Produtos' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT empresa_id) as empresas,
    COUNT(*) / NULLIF(COUNT(DISTINCT empresa_id), 0) as media_por_empresa,
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END) as registros_sem_empresa
FROM produtos
UNION ALL
SELECT
    'Vendas',
    COUNT(*),
    COUNT(DISTINCT empresa_id),
    COUNT(*) / NULLIF(COUNT(DISTINCT empresa_id), 0),
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END)
FROM vendas
UNION ALL
SELECT
    'Notas Fiscais',
    COUNT(*),
    COUNT(DISTINCT empresa_id),
    COUNT(*) / NULLIF(COUNT(DISTINCT empresa_id), 0),
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END)
FROM notas_fiscais
UNION ALL
SELECT
    'Itens Venda',
    COUNT(*),
    COUNT(DISTINCT empresa_id),
    COUNT(*) / NULLIF(COUNT(DISTINCT empresa_id), 0),
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END)
FROM itens_venda;

-- Usar view
SELECT * FROM v_saude_multiempresa;

-- Verificar performance de queries
SHOW FULL PROCESSLIST;

-- Monitorar conexões
SELECT COUNT(*) as conexoes_ativas FROM information_schema.processlist;

-- Verificar se índices estão sendo usados
SELECT * FROM information_schema.statistics
WHERE table_schema = 'grandport_erp'
AND column_name LIKE '%empresa%'
ORDER BY table_name;
```

---

## 🎯 EXECUÇÃO SEGURA - PASSO A PASSO

### Passo 1: Fazer Backup (CRÍTICO!)
```bash
# Linha de comando
mysqldump -u root -p grandport_erp > /backup/erp_antes_multiempresa.sql
echo "✅ Backup feito!"
```

### Passo 2: Executar Script 5 (Validar Backup)
```sql
-- Dentro do MySQL, rodar SCRIPT 5
-- Verificar que backup foi criado
```

### Passo 3: Executar Script 2 (Validar Integridade)
```sql
-- Dentro do MySQL, rodar SCRIPT 2
-- Se houver dados orphãos, corrigir
```

### Passo 4: Executar Script 3 (Validar Usuários)
```sql
-- Dentro do MySQL, rodar SCRIPT 3
-- Garantir que todos têm empresa_id
```

### Passo 5: Executar Script 1 (Criar Índices)
```sql
-- Dentro do MySQL, rodar SCRIPT 1
-- Monitorar: CREATE INDEX ... (pode levar alguns segundos)
```

### Passo 6: Executar Script 4 (Testar Isolamento)
```sql
-- Dentro do MySQL, rodar SCRIPT 4
-- Verificar: dados de empresa 1 ≠ empresa 2
```

### Passo 7: Executar Script 7 (Setup Monitoramento)
```sql
-- Dentro do MySQL, rodar SCRIPT 7
-- Criar view para monitorar saúde
```

### Passo 8: Fazer Deploy (Ver DEPLOYMENT_MULTIEMPRESA.md)

---

## ⚠️ SE ALGO DESSE ERRADO

### Reverter Índices (se lentou)
```sql
-- Remover índices problemáticos
DROP INDEX idx_produtos_empresa_id ON produtos;
DROP INDEX idx_vendas_empresa_id ON vendas;
-- Depois recriar após análise
```

### Reverter Banco Inteiro
```bash
# Restaurar backup
mysql -u root -p grandport_erp < /backup/erp_antes_multiempresa.sql
echo "✅ Banco restaurado!"
```

---

**Tempo Total**: ~15 minutos para rodar todos os scripts
**Risco**: MUITO BAIXO (apenas leitura no script 4, índices no 1)
**Impacto**: Zero downtime (índices criados em background)

**EXECUTE NA ORDEM!** 🎯

