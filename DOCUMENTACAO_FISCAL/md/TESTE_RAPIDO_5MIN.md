# 🧪 TESTE RÁPIDO - MULTI-EMPRESA (5 MINUTOS)

## ⚡ Execute este teste ANTES de fazer deploy em produção

---

## PASSO 1: Compilar (1 minuto)

```bash
cd /home/ubuntu/IdeaProjects/erp-core

# Limpar e compilar
mvn clean package -DskipTests -q

# Se compilou sem erros → ✅ Pronto para continuar
# Se teve erros → ❌ Não avance, corrija primeiro
```

---

## PASSO 2: Iniciar Aplicação Localmente (1 minuto)

```bash
# Abrir novo terminal
cd /home/ubuntu/IdeaProjects/erp-core
java -jar target/erp-core-0.0.1-SNAPSHOT.jar
```

**Aguarde 30 segundos para iniciar...**

Quando ver mensagem:
```
Started ErpCoreApplication in X.XXX seconds
```

✅ Aplicação está rodando!

---

## PASSO 3: Testar Endpoints Básicos (2 minutos)

### 3.1: Verificar que app responde

```bash
# Em outro terminal:
curl -s http://localhost:8080/actuator/health | jq '.'

# Esperado:
# {"status":"UP"}
```

### 3.2: Testar novo método - Produtos da Empresa

```bash
# Testar novo método (com empresaId)
# NOTA: Você precisa ter um token válido de um usuário

curl -s http://localhost:8080/api/produtos \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" | jq '.[] | {id, nome, sku, empresaId}' | head -20

# Esperado:
# {
#   "id": 1,
#   "nome": "Produto A",
#   "sku": "SKU-001",
#   "empresaId": 1
# }
```

### 3.3: Verificar Isolamento

```bash
# Com 2 usuários diferentes, testar que os dados são isolados

# Token do usuário 1 (empresa 1)
curl -s http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_USER1" | jq 'length'

# Token do usuário 2 (empresa 2)
curl -s http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_USER2" | jq 'length'

# Os números devem ser DIFERENTES!
# Se iguais → Isolamento não funciona
```

---

## PASSO 4: Verificar Logs (1 minuto)

Volte para o terminal onde a aplicação está rodando e procure por:

### ✅ Sinais de SUCESSO
```
🟢 RADAR SAAS: Liberando dados da Empresa [1] para o usuário: admin
🏢 Empresa do usuário: 1
✅ Repositório encontrado: ProdutoRepository
```

### ❌ Sinais de ERRO
```
🔴 ALERTA SAAS: O crachá está incompleto!
⚠️ Erro ao extrair empresa do contexto
Exception in thread
NullPointerException
```

Se vir erros, **não faça deploy** - investigar primeiro!

---

## RESUMO DO TESTE

Se tudo passou:
- ✅ Compilou sem erros
- ✅ Aplicação iniciou (UP)
- ✅ Endpoints responderam
- ✅ Isolamento funciona
- ✅ Logs mostram sucesso

**→ PRONTO PARA DEPLOY!** 🚀

---

## O QUE FOI TESTADO

| Componente | Status | Teste |
|-----------|--------|-------|
| Compilação | ✅ | `mvn clean package` |
| Aplicação | ✅ | `/actuator/health` |
| Repositório | ✅ | `GET /api/produtos` |
| Isolamento | ✅ | 2 empresas diferentes |
| Logs | ✅ | Procurar por erros |

---

## PRÓXIMOS PASSOS

1. ✅ Teste passou? → Ir para `DEPLOYMENT_MULTIEMPRESA.md`
2. ❌ Teste falhou? → Investigar log e corrigir

**Tempo total**: ~5 minutos ⏱️
**Confiabilidade**: Alta ✅

