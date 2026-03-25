# 🔴 DIAGNÓSTICO CRÍTICO: Sincronização Multi-Empresas Não Funciona

**Data**: 2026-03-25
**Status**: ⚠️ CRÍTICO - Sistema em estado de falha multi-tenant
**Prioridade**: P0 - Bloqueador

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. ❌ **Tenant ID Mismatch** (Principal)
```
ERROR: assigned tenant id differs from current tenant id [1 != 2]
for entity com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema.empresaId
```

**Causa Raiz**: Quando a `ConfiguracaoService.atualizarConfiguracao()` é chamada por um usuário da empresa 2, a entidade `ConfiguracaoSistema` mantém `empresaId = 1L` (padrão), gerando conflito com o `TenantResolver` que define contexto = 2.

**Impacto**:
- ❌ Não consegue salvar configurações
- ❌ HTTP 403 Forbidden em `GET /api/configuracoes`
- ❌ Múltiplas tentativas causam travamento

---

### 2. ❌ **Lazy Initialization Exceptions**
```
LazyInitializationException: Cannot lazily initialize collection of role
'com.grandport.erp.modules.vendas.model.Venda.itens'
with key '1' (no session)
```

**Causa Raiz**: Entidades estão sendo serializadas para JSON sem a sessão Hibernate ativa. O `fetch = FetchType.EAGER` na `Venda` está configurado, mas não está funcionando em todos os cenários.

**Impacto**:
- ❌ Erro ao gerar PDFs A4
- ❌ Falha ao carregar vendas com itens
- ❌ Desempenho ruim em relatórios

---

### 3. ❌ **Nova Empresa Herda Dados da Empresa 1**
```
Nova empresa criada com ID = 2, mas usuário vê dados da empresa 1
```

**Causa Raiz**: Múltiplas causas:
- `ConfiguracaoSistema` tem ID hardcoded = 1L
- `BaseEntityMultiEmpresa` tem valor padrão `empresaId = 1L`
- `TenantResolver` não consegue forçar isolamento correto

**Impacto**:
- ❌ Dados vazam entre empresas
- ❌ CNPJ, telefone, configurações da empresa 1 aparecem para empresa 2
- ❌ Violação de segurança e isolamento de dados

---

### 4. ❌ **HTTP 403 Forbidden em Configurações**
```
GET /api/configuracoes 403 (Forbidden)
```

**Causa Raiz**: Combinação de:
- Entidade com `empresaId` errado
- `@PreAuthorize` não está reconhecendo permissões corretas
- `TenantResolver` retornando empresa incorreta

**Impacto**:
- ❌ Interface bloqueada
- ❌ Usuários não conseguem acessar settings

---

### 5. ❌ **Email Testing Retorna 400 Bad Request**
```
GET /api/fiscal/testar-email 400 (Bad Request)
```

**Causa Raiz**: Mesmo problema de tenant ID - não consegue carregar configuração SMTP.

---

## 📊 FLUXO ESPERADO vs REAL

### ESPERADO (Correto)
```
Usuário (empresa 2) faz login
    ↓
Token JWT contém: sub: "user@empresa2.com"
    ↓
AuthenticationManager carrega Usuario do banco
    ↓
Usuario.empresaId = 2 (do banco)
    ↓
TenantResolver.resolveCurrentTenantIdentifier() = 2
    ↓
Hibernate filtra queries com WHERE empresa_id = 2
    ↓
ConfiguracaoSistema.atualizarConfiguracao() recebe empresaId = 2
    ↓
Hibernate verifica: empresaId na entidade = 2 vs contexto = 2
    ↓
✅ SUCESSO - Salva com sucesso
```

### REAL (Broken)
```
Usuário (empresa 2) faz login
    ↓
Token JWT contém: sub: "user@empresa2.com"
    ↓
AuthenticationManager carrega Usuario do banco
    ↓
Usuario.empresaId = 2 (do banco) ✅
    ↓
TenantResolver.resolveCurrentTenantIdentifier() = 2 ✅
    ↓
Hibernate filtra queries com WHERE empresa_id = 2 ✅
    ↓
ConfiguracaoSistema.atualizarConfiguracao() recebe objeto
    ↓
⚠️ O objeto novo tem empresaId = null ou 1L
    ↓
BeanUtils.copyProperties() copia tudo INCLUINDO empresaId = 1L
    ↓
Hibernate verifica: empresaId na entidade = 1L vs contexto = 2
    ↓
❌ ERRO: "assigned tenant id differs from current tenant id [1 != 2]"
```

---

## 🔧 SOLUÇÃO: 5 CORREÇÕES NECESSÁRIAS

### CORREÇÃO 1: BaseEntityMultiEmpresa - Remover valor padrão
**Arquivo**: `src/main/java/com/grandport/erp/modules/multiEmpresa/BaseEntityMultiEmpresa.java`

**Problema**: `private Long empresaId = 1L;` força que todas as entidades herdadas herdem empresa 1

**Solução**: Remover o `= 1L` e deixar null até ser atribuído

```java
@TenantId
@Column(name = "empresa_id", nullable = false, columnDefinition = "bigint")
private Long empresaId;  // ← SEM VALOR PADRÃO
```

---

### CORREÇÃO 2: ConfiguracaoSistema - ID dinâmico por empresa
**Arquivo**: `src/main/java/com/grandport/erp/modules/configuracoes/model/ConfiguracaoSistema.java`

**Problema**: `private Long id = 1L;` força ID 1, quebrando multi-tenant

**Solução**: Usar estratégia diferente para cada empresa

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;  // ← ID auto-gerado, não hardcoded

@Transient
public boolean isConfigPadrao() {
    return this.empresaId != null;
}
```

---

### CORREÇÃO 3: ConfiguracaoService - Preencher empresaId antes de salvar
**Arquivo**: `src/main/java/com/grandport/erp/modules/configuracoes/service/ConfiguracaoService.java`

**Problema**: `BeanUtils.copyProperties()` copia `empresaId = 1L` do objeto novo

**Solução**: Preservar `empresaId` do banco antes de copiar

```java
@Transactional
public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema dadosAtualizados) {
    ConfiguracaoSistema configBanco = repository.findById(1L)
        .orElseThrow(() -> new RuntimeException("Configuração não encontrada"));

    // 🔐 CRÍTICO: Pegar empresaId ANTES de sobrescrever
    Long empresaIdOriginal = configBanco.getEmpresaId();

    // Copiar EXCLUINDO empresaId
    org.springframework.beans.BeanUtils.copyProperties(
        dadosAtualizados,
        configBanco,
        "id", "empresaId"  // ← Não sobrescrever
    );

    // 🔐 Restaurar empresaId
    configBanco.setEmpresaId(empresaIdOriginal);

    return repository.save(configBanco);
}
```

---

### CORREÇÃO 4: ConfiguracaoRepository - Query multi-tenant
**Arquivo**: `src/main/java/com/grandport/erp/modules/configuracoes/repository/ConfiguracaoRepository.java`

**Problema**: `findById(1L)` ignora tenant e sempre retorna empresa 1

**Solução**: Adicionar query que respeita tenant

```java
public interface ConfiguracaoRepository extends JpaRepository<ConfiguracaoSistema, Long> {

    // 🔐 Query que respeita o contexto de tenant
    Optional<ConfiguracaoSistema> findFirstByEmpresaId(Long empresaId);

    // 🔐 Query para obter última configuração da empresa (seguro)
    Optional<ConfiguracaoSistema> findFirstByEmpresaIdOrderByIdDesc(Long empresaId);
}
```

---

### CORREÇÃO 5: ConfiguracaoService - Usar repository correto
**Arquivo**: `src/main/java/com/grandport/erp/modules/configuracoes/service/ConfiguracaoService.java`

**Problema**: `repository.findById(1L)` ignora contexto de tenant

**Solução**: Usar query multi-tenant + extrair empresa do usuário

```java
public ConfiguracaoSistema obterConfiguracao() {
    // 🔐 Extrair empresaId do usuário autenticado
    Long empresaId = obterEmpresaIdDoUsuario();

    // 🔐 Buscar configuração DA EMPRESA ATUAL
    ConfiguracaoSistema config = repository
        .findFirstByEmpresaIdOrderByIdDesc(empresaId)
        .orElseGet(() -> criarConfiguracaoPadraoParaEmpresa(empresaId));

    return config;
}

// 🔐 Helper para extrair empresaId
private Long obterEmpresaIdDoUsuario() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof Usuario) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        if (usuario.getEmpresaId() != null) {
            return usuario.getEmpresaId();
        }
    }
    return 1L; // Fallback
}

// 🔐 Criar config padrão para nova empresa
private ConfiguracaoSistema criarConfiguracaoPadraoParaEmpresa(Long empresaId) {
    ConfiguracaoSistema config = new ConfiguracaoSistema();
    config.setEmpresaId(empresaId);  // ← ESSENCIAL
    config.setHorarioBackupAuto("03:00");
    config.setSerieNfe(1);
    config.setNumeroProximaNfe(1L);
    return repository.save(config);
}
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

| Etapa | Ação | Tempo | Status |
|-------|------|-------|--------|
| 1 | Corrigir `BaseEntityMultiEmpresa` | 5 min | ⏳ TODO |
| 2 | Corrigir `ConfiguracaoSistema.id` | 5 min | ⏳ TODO |
| 3 | Corrigir `ConfiguracaoService` | 15 min | ⏳ TODO |
| 4 | Corrigir `ConfiguracaoRepository` | 5 min | ⏳ TODO |
| 5 | Compilar e testar | 10 min | ⏳ TODO |
| **TOTAL** | | **40 min** | |

---

## ✅ TESTES PÓS-CORREÇÃO

1. **Login com empresa 2**
   - [ ] Token gerado
   - [ ] Usuario.empresaId = 2

2. **Acessar /api/configuracoes**
   - [ ] GET 200 OK (não 403)
   - [ ] Retorna config da empresa 2

3. **Salvar configurações**
   - [ ] PUT 200 OK
   - [ ] Não gera "assigned tenant id differs"

4. **Testar email**
   - [ ] GET /api/fiscal/testar-email 200 OK

5. **Gerar PDF**
   - [ ] Sem "LazyInitializationException"
   - [ ] PDF gerado com sucesso

6. **Criar 3ª empresa**
   - [ ] empresa_id = 3
   - [ ] Isolada das anteriores
   - [ ] Configurações separadas

---

## 🎯 MÉTRICAS DE SUCESSO

- ✅ Sem erro "assigned tenant id differs"
- ✅ Sem erro "LazyInitializationException"
- ✅ Sem HTTP 403 em configurações
- ✅ Email test retorna 200
- ✅ 3 empresas totalmente isoladas
- ✅ Cada empresa tem suas próprias configs
- ✅ PDFs gerados sem erro

---

## 📝 NOTAS IMPORTANTES

1. **Não mexer em AuthenticationController** - Login está OK
2. **Não mexer em TenantResolver** - Isolamento está OK
3. **Não mexer em AuditoriaService** - Já foi corrigido
4. **Foco total em ConfiguracaoSistema** - Aí está 80% do problema
5. **Depois testar todas as entidades que herdam de BaseEntityMultiEmpresa**


