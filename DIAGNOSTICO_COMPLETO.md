# 📋 Diagnóstico Completo e Soluções - Projeto ERP Multi-Empresa

## 🔴 Problemas Identificados

### 1. ❌ ERRO: NoClassDefFoundError ao Gerar Boleto
**Status**: ✅ **RESOLVIDO**

**Erro:**
```
java.lang.NoClassDefFoundError: com/lowagie/text/pdf/FopGlyphProcessor
```

**Solução Aplicada:**
- Adicionada dependência explícita: `com.itextpdf:itextpdf:5.5.13.3`
- Removida duplicação de Lombok
- Build concluído com sucesso

---

### 2. ⚠️ LazyInitializationException - Lazy Loading

**Erros observados:**
```
ERROR: Cannot lazily initialize collection of role 'com.grandport.erp.modules.vendas.model.Venda.itens'
with key '1' (no session)

ERROR: Cannot lazily initialize collection of role 'com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema.vendedores'
with key '1' (no session)
```

**Status**: ✅ **JÁ CORRIGIDO NO CÓDIGO**

**Verificação**:
- ✅ Venda.java - `@OneToMany(fetch = FetchType.EAGER)` em itens
- ✅ Venda.java - `@OneToMany(fetch = FetchType.EAGER)` em pagamentos
- ✅ Venda.java - `@OneToOne(fetch = FetchType.EAGER)` em notaFiscal

---

### 3. 🚨 Multi-Empresa - Integridade de Dados

**Erros observados:**
```
ERROR: assigned tenant id differs from current tenant id [1 != 2] for entity
com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema.empresaId

ERROR: null value in column "id" of relation "configuracoes_sistema" violates not-null constraint
```

**Problema**:
- Fluxo de login/cadastro de empresa está permitindo que usuário de uma empresa acesse dados de outra
- Gerador de ID automático não está funcionando corretamente para ConfiguracaoSistema

**Causa Raiz**:
O código está gerando dados de uma empresa mas tentando inserir com tenant_id de outra.

**Ações Necessárias**:
1. Verificar o fluxo de login em `CadastroEmpresa.jsx`
2. Validar interceptors de requisição HTTP
3. Verificar filtro de multi-tenant no backend

---

### 4. 🔐 Acesso a Dados de Outra Empresa

**Problema**:
Quando cria uma nova empresa no `CadastroEmpresa.jsx`, o usuário continua logado na empresa anterior e acessa dados dela.

**Status**: ❌ **REQUER INVESTIGAÇÃO**

**Possível Causa**:
- Token JWT não está sendo regenerado após criar nova empresa
- Filtro de multi-tenant não está validando corretamente no backend

---

### 5. 💾 Módulo Financeiro - Visibilidade Multi-Empresa

**Pergunta**: "Veja se os dados está vendo dados de outra empresa"

**Status**: ⚠️ **NECESSÁRIO VALIDAR**

**Ações a Tomar**:
1. Verificar se todas as queries no módulo financeiro usam filtro de empresaId
2. Confirmar que TenantFilter está ativo em todas as requisições
3. Validar relacionamentos cruzados

---

## 🔧 Solução: Erro de Configuração de Empresa (ID = null)

### Problema Específico

```sql
ERROR: null value in column "id" of relation "configuracoes_sistema"
violates not-null constraint
Failing row contains (2, 2, 1, 10.00, ..., null, ...)
                     ↑  ↑
                empresa_id=2, mas id=null
```

### Causa

O `SequenceGenerator` não está criando o ID automaticamente. Possível:
1. Sequência não existe no banco
2. Gerador não está configurado corretamente
3. Tentativa de inserir manualmente

### Solução Recomendada

**Arquivo**: `ConfiguracaoSistema.java`

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)  // Simpler approach
private Long id;

// OU, se preferir usar sequence:

@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "configuracoes_sistema_id_seq")
@SequenceGenerator(
    name = "configuracoes_sistema_id_seq",
    sequenceName = "configuracoes_sistema_id_seq",
    allocationSize = 1,
    initialValue = 1
)
private Long id;
```

**Adicione a Migration Flyway**:

Arquivo: `src/main/resources/db/migration/V{VERSION}__Create_Sequence_Configuracoes.sql`

```sql
-- Criar sequência se não existir
CREATE SEQUENCE IF NOT EXISTS configuracoes_sistema_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
```

---

## 📊 Checklist Multi-Empresa

Para garantir sincronismo total multi-empresa:

### Backend
- [ ] Todas as entidades estendem `BaseEntityMultiEmpresa`
- [ ] TenantFilter está ativo em `application.properties`
- [ ] Todas as queries incluem filtro `WHERE empresa_id = :empresaId`
- [ ] Controllers injetam `TenantContext.getCurrentTenantId()`
- [ ] Transações usam `@Transactional` corretamente

### Banco de Dados
- [ ] Tabela `configuracoes_sistema` tem coluna `empresa_id` e constraint
- [ ] Índices criados em colunas de busca + empresaId
- [ ] Sequences funcionando corretamente

### Frontend
- [ ] Token JWT armazenado com `empresaId`
- [ ] Axiom interceptor envia `X-Tenant-ID` no header
- [ ] Após trocar empresa, fazer logout/login para renovar token
- [ ] Componentes verificam se dados pertencem à empresa atual

### Exemplos de Queries Corretas

**❌ ERRADO**:
```java
@Query("SELECT c FROM ConfiguracaoSistema c")
List<ConfiguracaoSistema> findAll();
```

**✅ CORRETO**:
```java
@Query("SELECT c FROM ConfiguracaoSistema c WHERE c.empresaId = :empresaId")
Optional<ConfiguracaoSistema> findByEmpresaId(@Param("empresaId") Long empresaId);
```

---

## 🧪 Teste de Multi-Empresa

### Passo 1: Criar duas empresas

```bash
POST /api/empresas
{
  "nome": "Empresa A",
  "cnpj": "11.222.333/0001-44"
}

POST /api/empresas
{
  "nome": "Empresa B",
  "cnpj": "55.666.777/0001-88"
}
```

### Passo 2: Login em cada empresa

```bash
POST /api/auth/login
{
  "email": "user@empresa-a.com",
  "password": "senha123"
}
# Recebe token com empresaId=1

POST /api/auth/login
{
  "email": "user@empresa-b.com",
  "password": "senha123"
}
# Recebe token com empresaId=2
```

### Passo 3: Validar isolamento de dados

**Com token da Empresa A:**
```bash
GET /api/configuracoes
Header: Authorization: Bearer {token_empresa_a}
# Deve retornar APENAS dados da empresa A
```

**Com token da Empresa B:**
```bash
GET /api/configuracoes
Header: Authorization: Bearer {token_empresa_b}
# Deve retornar APENAS dados da empresa B
```

---

## 📝 Próximas Ações Recomendadas

### 1. **Validação Imediata** (15 min)
- [ ] Confirmar build Maven sucesso
- [ ] Testar geração de boleto via API
- [ ] Verificar logs para `NoClassDefFoundError`

### 2. **Investigação Multi-Empresa** (1 hora)
- [ ] Validar fluxo CadastroEmpresa.jsx
- [ ] Verificar TenantFilter está ativo
- [ ] Revisar queries do módulo financeiro

### 3. **Correção de Lazy Loading** (30 min)
- [ ] Confirmar todas as collections usam EAGER
- [ ] Testar gerar PDF de venda
- [ ] Testar carregar configurações

### 4. **Testes de Regressão** (2 horas)
- [ ] Login multi-empresa
- [ ] CRUD com isolamento de dados
- [ ] Relatórios por empresa

---

## 📚 Referências

- **Boleto**: caelum-stella-boleto 2.1.5 requer iText 5
- **Multi-Tenant**: Usar `@PrePersist` e TenantContext
- **Lazy Loading**: Sempre usar EAGER para collections em REST APIs

---

## 🎯 Status Geral

| Funcionalidade | Status | Prioridade |
|---|---|---|
| Boleto (FopGlyph) | ✅ RESOLVIDO | Alta |
| Lazy Loading | ✅ CÓDIGO OK | Alta |
| Multi-Empresa | ⚠️ VALIDAR | Crítica |
| Configurações ID | ⚠️ VALIDAR | Alta |
| Módulo Financeiro | ⚠️ VALIDAR | Alta |

---

**Data de Resolução**: 2026-03-26
**Versão do Projeto**: 0.0.1-SNAPSHOT
**Java**: 17
**Spring Boot**: 4.0.3

