# 🗄️ SCRIPTS SQL - SINCRONIZAÇÃO FISCAL × ESTOQUE

## ⚠️ IMPORTANTE

Sempre faça um BACKUP antes de rodar SQL em produção:

```bash
mysqldump -u seu_usuario -p seu_banco > backup_antes_fiscal.sql
```

---

## 📋 SCRIPT 1: DIAGNOSTICAR O PROBLEMA

Execute isto PRIMEIRO para saber quantos produtos estão incompletos:

```sql
-- ========================================================================
-- 🔍 DIAGNÓSTICO: Quantos produtos faltam dados fiscais?
-- ========================================================================

-- Produtos totais
SELECT COUNT(*) as total_produtos FROM produtos;

-- Produtos SEM NCM
SELECT COUNT(*) as sem_ncm FROM produtos WHERE ncm_codigo IS NULL;

-- Produtos SEM CFOP
SELECT COUNT(*) as sem_cfop FROM produtos WHERE cfop_padrao IS NULL;

-- Produtos SEM CSOSN/CST
SELECT COUNT(*) as sem_tributacao
FROM produtos
WHERE (csosn_padrao IS NULL OR csosn_padrao = '')
  AND (cst_padrao IS NULL OR cst_padrao = '');

-- Produtos SEM ICMS
SELECT COUNT(*) as sem_icms FROM produtos WHERE aliquota_icms IS NULL;

-- Produtos SEM MARCA
SELECT COUNT(*) as sem_marca FROM produtos WHERE marca_id IS NULL;

-- ========================================================================
-- RESULTADO: Se todos retornarem 0, você não precisa corrigir nada!
-- ========================================================================
```

---

## 📋 SCRIPT 2: LISTAR PRODUTOS INCOMPLETOS

Se o diagnóstico encontrou produtos incompletos, veja quais são:

```sql
-- ========================================================================
-- 📌 LISTAR: Quais são os produtos incompletos?
-- ========================================================================

SELECT
    id,
    nome,
    sku,
    CASE WHEN ncm_codigo IS NULL THEN '❌' ELSE '✅' END as ncm,
    CASE WHEN cfop_padrao IS NULL THEN '❌' ELSE '✅' END as cfop,
    CASE WHEN aliquota_icms IS NULL THEN '❌' ELSE '✅' END as icms,
    CASE WHEN marca_id IS NULL THEN '❌' ELSE '✅' END as marca
FROM produtos
WHERE ncm_codigo IS NULL
   OR cfop_padrao IS NULL
   OR aliquota_icms IS NULL
   OR marca_id IS NULL
ORDER BY nome;
```

---

## 📋 SCRIPT 3: CORRIGIR PRODUTOS INCOMPLETOS

Execute APENAS se encontrou produtos incompletos no Script 2:

```sql
-- ========================================================================
-- 🔧 CORREÇÃO: Preenchendo dados faltantes
-- ========================================================================

-- ⚠️ IMPORTANTE: Verifique qual é o regime tributário da sua empresa
-- 1 = Simples Nacional → Use CSOSN
-- 3 = Regime Normal → Use CST (não está aqui porque você usa CFOP)

-- Passo 1: Corrigir produtos SEM NCM
-- NCM "Outras" = 50000000 (use isto como padrão)
UPDATE produtos
SET ncm_codigo = '50000000'
WHERE ncm_codigo IS NULL;

-- Passo 2: Corrigir produtos SEM CFOP
-- CFOP "5102" = Venda dentro do estado
UPDATE produtos
SET cfop_padrao = '5102'
WHERE cfop_padrao IS NULL OR cfop_padrao = '';

-- Passo 3: Corrigir produtos SEM CSOSN (Simples Nacional)
-- CSOSN "102" = Sem débito (você é simples nacional)
UPDATE produtos
SET csosn_padrao = '102'
WHERE csosn_padrao IS NULL OR csosn_padrao = '';

-- Passo 4: Corrigir produtos SEM ICMS
-- 18% é alíquota padrão em muitos estados
UPDATE produtos
SET aliquota_icms = 18.00
WHERE aliquota_icms IS NULL;

-- Passo 5: Corrigir produtos SEM MARCA
-- Se souber qual marca é padrão, use:
UPDATE produtos
SET marca_id = 1  -- 🚨 AJUSTE: mude 1 para o ID correto da marca!
WHERE marca_id IS NULL;

-- ========================================================================
-- ✅ VERIFICAR RESULTADO
-- ========================================================================

-- Rodar o diagnóstico novamente:
SELECT COUNT(*) as sem_ncm FROM produtos WHERE ncm_codigo IS NULL;
SELECT COUNT(*) as sem_cfop FROM produtos WHERE cfop_padrao IS NULL;
-- Devem retornar 0
```

---

## 📋 SCRIPT 4: AJUSTE FINO (Opcional)

Se você quer valores mais precisos por categoria:

```sql
-- ========================================================================
-- 🎯 AJUSTE FINO: Alíquotas por categoria
-- ========================================================================

-- Exemplo: Eletrônicos com alíquota diferente
UPDATE produtos
SET aliquota_icms = 12.00
WHERE categoria_id IN (
    SELECT id FROM categorias WHERE nome LIKE '%Eletrônico%'
) AND aliquota_icms IS NULL;

-- Exemplo: Roupas com alíquota diferente
UPDATE produtos
SET aliquota_icms = 18.00
WHERE categoria_id IN (
    SELECT id FROM categorias WHERE nome LIKE '%Roupa%'
) AND aliquota_icms IS NULL;

-- Exemplo: CFOP diferente para venda fora do estado
-- ⚠️ IMPORTANTE: Isso é apenas exemplo. Use sua lógica correta.
-- UPDATE produtos SET cfop_padrao = '6102' WHERE ... ;
```

---

## 📋 SCRIPT 5: VALIDAR DADOS FISCAIS

Após corrigir, valide se tudo ficou OK:

```sql
-- ========================================================================
-- ✅ VALIDAÇÃO: Todos os dados estão OK?
-- ========================================================================

SELECT
    COUNT(*) as total,
    SUM(CASE WHEN ncm_codigo IS NOT NULL THEN 1 ELSE 0 END) as com_ncm,
    SUM(CASE WHEN cfop_padrao IS NOT NULL THEN 1 ELSE 0 END) as com_cfop,
    SUM(CASE WHEN aliquota_icms IS NOT NULL THEN 1 ELSE 0 END) as com_icms,
    SUM(CASE WHEN marca_id IS NOT NULL THEN 1 ELSE 0 END) as com_marca
FROM produtos;

-- Resultado esperado:
-- total = com_ncm = com_cfop = com_icms = com_marca
-- Se sim, está 100% sincronizado! ✅
```

---

## 📋 SCRIPT 6: RELATÓRIO FINAL

Para gerar um relatório bonito:

```sql
-- ========================================================================
-- 📊 RELATÓRIO: Status de sincronização fiscal
-- ========================================================================

SELECT
    'Total de Produtos' as metrica,
    COUNT(*) as valor
FROM produtos

UNION ALL

SELECT
    'Produtos Completos (100%)',
    COUNT(*)
FROM produtos
WHERE ncm_codigo IS NOT NULL
  AND cfop_padrao IS NOT NULL
  AND aliquota_icms IS NOT NULL
  AND marca_id IS NOT NULL

UNION ALL

SELECT
    'Produtos Incompletos',
    COUNT(*)
FROM produtos
WHERE ncm_codigo IS NULL
   OR cfop_padrao IS NULL
   OR aliquota_icms IS NULL
   OR marca_id IS NULL

UNION ALL

SELECT
    'Percentual Pronto (%)',
    ROUND(
        (SUM(CASE
            WHEN ncm_codigo IS NOT NULL
            AND cfop_padrao IS NOT NULL
            AND aliquota_icms IS NOT NULL
            AND marca_id IS NOT NULL THEN 1
            ELSE 0
        END) / COUNT(*)) * 100,
        2
    )
FROM produtos;

-- Resultado esperado:
-- Percentual Pronto = 100%
```

---

## 🎯 PASSO-A-PASSO RECOMENDADO

### **Passo 1: Faça Backup** (2 minutos)
```bash
mysqldump -u usuario -p banco > backup.sql
```

### **Passo 2: Execute Diagnóstico** (Script 1)
```sql
-- Copie e execute todos os SELECTs do Script 1
-- Anote os números que encontrar
```

### **Passo 3: Se Encontrou Incompletos**
```sql
-- Execute Script 2 para ver quais são
-- Execute Script 3 para corrigir
```

### **Passo 4: Valide Resultado** (Script 5)
```sql
-- Execute para confirmar que ficou 100%
```

### **Passo 5: Teste no Sistema**
- Abra o Swagger
- Acesse `/api/produtos/auditoria-fiscal`
- Veja se retorna 0 produtos incompletos

---

## 💾 BACKUP E RECUPERAÇÃO

### **Fazer Backup (ANTES de qualquer mudança)**
```bash
mysqldump -u seu_usuario -p seu_banco > backup_fiscal_2026_03_21.sql
```

### **Restaurar Backup (se deu errado)**
```bash
mysql -u seu_usuario -p seu_banco < backup_fiscal_2026_03_21.sql
```

---

## 🚨 ERROS COMUNS

### **Erro 1: "ncm_codigo não existe"**
**Causa**: Nome da coluna está diferente no seu banco

**Solução**: Adapte o nome no SQL. Procure a coluna correta:
```sql
-- Discover o nome exato:
DESCRIBE produtos;
```

### **Erro 2: "UPDATE afetou 0 linhas"**
**Causa**: Ou a coluna já tem dados, ou o nome está errado

**Solução**: Rode o diagnóstico (Script 1) novamente

### **Erro 3: "Access denied"**
**Causa**: Usuário não tem permissão

**Solução**: Use um usuário com privilégio ALTER:
```bash
mysql -u root -p seu_banco < script.sql
```

---

## ✅ CHECKLIST SQL

- [ ] Fiz backup do banco (`mysqldump`)
- [ ] Executei Script 1 (Diagnóstico)
- [ ] Anotei os números encontrados
- [ ] Se encontrou incompletos, executei Script 2
- [ ] Executei Script 3 (Correção)
- [ ] Executei Script 5 (Validação)
- [ ] Validação retornou 100% OK
- [ ] Testei no Swagger (`/api/produtos/auditoria-fiscal`)

Se tudo acima está marcado = ✅ **SQL 100% OK**

---

## 💡 DICAS

**Dica 1**: Execute os SQLs um por um, não todos de uma vez.

**Dica 2**: Sempre veja o resultado de um SELECT antes de fazer UPDATE.

**Dica 3**: Se não tem certeza, faça a mudança em uma cópia primeiro.

**Dica 4**: Documente em um arquivo qual NCM/CFOP você usou como padrão.

---

## 📞 REFERÊNCIA RÁPIDA

| Campo | Padrão Usado | Significado |
|-------|------------|------------|
| ncm_codigo | 50000000 | Outras (genérico) |
| cfop_padrao | 5102 | Venda dentro do estado |
| csosn_padrao | 102 | Sem débito (Simples Nacional) |
| aliquota_icms | 18.00 | 18% (padrão comum) |

---

**Pronto! Execute com confiança! 🚀**

*SQL criado em 21/03/2026*

