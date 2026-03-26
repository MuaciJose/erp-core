# 🔐 Guia de Resolução: Multi-Empresa & Isolamento de Dados

## Análise da Configuração Atual

### ✅ O que JÁ está implementado corretamente:

1. **TenantResolver** (`config/tenant/TenantResolver.java`)
   - ✅ Extrai `empresaId` do objeto `Usuario` no SecurityContext
   - ✅ Usa `CurrentTenantIdentifierResolver` do Hibernate
   - ✅ Retorna fallback para empresa 1 se não autenticado

2. **ConfiguracaoService** (`ConfiguracaoService.java`)
   - ✅ Método `obterEmpresaIdDoUsuario()` extrai empresaId do SecurityContext
   - ✅ Query usa `findFirstByEmpresaIdOrderByIdDesc(empresaId)`
   - ✅ Cria configuração padrão se não existir

3. **ConfiguracaoRepository** (`ConfiguracaoRepository.java`)
   - ✅ Método `findFirstByEmpresaIdOrderByIdDesc(Long empresaId)` com filtro correto

4. **BaseEntityMultiEmpresa**
   - ✅ Todas as entidades estendem esta classe
   - ✅ Garante coluna `empresa_id` em todas as tabelas

---

## ❌ Problemas Identificados e Soluções

### Problema 1: "403 Forbidden" ao acessar `/api/configuracoes`

**Erro no log:**
```
GET http://192.168.1.104:8080/api/configuracoes 403 (Forbidden)
```

**Causa Possível:**
- Usuário não tem role `ADMIN`, `GERENTE` ou `CONFIGURADOR`
- Token JWT está expirado

**Solução:**

**Arquivo**: `ConfiguracaoController.java` (linha ~25)

```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'CONFIGURADOR')")
public ResponseEntity<ConfiguracaoSistema> obterConfig() {
    return ResponseEntity.ok(service.obterConfiguracao());
}
```

**Ação:**
1. Verificar que o usuário tem uma das roles exigidas
2. Fazer logout/login novamente para renovar token
3. Se continuar com 403, verificar se há filtro de CORS bloqueando

---

### Problema 2: "Assigned tenant id differs from current tenant id [1 != 2]"

**Erro completo:**
```
assigned tenant id differs from current tenant id [1 != 2] for entity
com.grandport.erp.modules.configuracoes.model.ConfiguracaoSistema.empresaId
```

**Causa Raiz:**
- Tentativa de salvar configuração com `empresaId=2` mas o usuario está em contexto de `empresaId=1`
- Possível que `CadastroEmpresa.jsx` esteja enviando dados de forma errada

**Solução:**

**Arquivo**: `ConfiguracaoService.java` - Método `atualizarConfiguracao`

Adicione validação:

```java
@Transactional
public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema config) {
    // 🔐 Validar que o empresaId do config bate com o do usuario
    Long empresaIdUsuario = obterEmpresaIdDoUsuario();

    if (!empresaIdUsuario.equals(config.getEmpresaId())) {
        throw new SecurityException(
            "❌ Tentativa de alterar configuração de outra empresa! " +
            "Esperado: " + empresaIdUsuario + ", Recebido: " + config.getEmpresaId()
        );
    }

    // Salvar normalmente
    return repository.save(config);
}
```

---

### Problema 3: "null value in column 'id' violates not-null constraint"

**Erro:**
```sql
ERROR: null value in column "id" of relation "configuracoes_sistema"
violates not-null constraint
Failing row contains (2, 2, 1, 10.00, ..., null, ...)
```

**Causa:**
- O SequenceGenerator não está gerando ID corretamente
- Possível que o objeto tenha ID = null sendo enviado do frontend

**Solução 1: Verificar SequenceGenerator**

**Arquivo**: `ConfiguracaoSistema.java`

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "configuracoes_sistema_id_seq")
@SequenceGenerator(
    name = "configuracoes_sistema_id_seq",
    sequenceName = "configuracoes_sistema_id_seq",
    allocationSize = 1,
    initialValue = 1  // ← ADICIONE ISTO
)
private Long id;
```

**Solução 2: Criar Migration Flyway**

**Arquivo**: `src/main/resources/db/migration/V{VERSAO}__Fix_Configuracoes_Sequence.sql`

```sql
-- Verificar se sequence existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences
        WHERE sequencename = 'configuracoes_sistema_id_seq'
    ) THEN
        CREATE SEQUENCE configuracoes_sistema_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;

        -- Definir como default para a coluna ID
        ALTER TABLE configuracoes_sistema
            ALTER COLUMN id SET DEFAULT nextval('configuracoes_sistema_id_seq');
    END IF;
END $$;
```

**Solução 3: Frontend - Não enviar ID**

**Arquivo**: `CadastroEmpresa.jsx` (parte de salvar configuração)

```javascript
// ❌ NÃO FAZER ISTO:
const dados = {
    id: null,  // ← Remove esta linha!
    empresaId: empresaId,
    nomeFantasia: "...",
    ...
};

// ✅ FAZER ISTO:
const dados = {
    // Não inclua 'id' aqui
    empresaId: empresaId,
    nomeFantasia: "...",
    ...
};
```

---

### Problema 4: Usuário logado em Empresa A mas acessa dados de Empresa B

**Cenário:**
1. Cria nova empresa (Empresa B)
2. Continuou logado como usuário da Empresa A
3. Pode ver/alterar dados da Empresa B

**Causa:**
- Token JWT não foi regenerado
- Frontend não está enviando novo token após criar empresa

**Solução:**

**Arquivo**: `CadastroEmpresa.jsx`

```javascript
// Após criar a empresa com sucesso:
const response = await axios.post('/api/empresas', novaEmpresa);
const { empresaId } = response.data;

// ✅ FAZER LOGOUT AUTOMÁTICO
localStorage.removeItem('token');
localStorage.removeItem('empresaId');

// ✅ REDIRECIONAR PARA LOGIN NOVAMENTE
setTimeout(() => {
    window.location.href = '/login';
}, 1000);

// OU, se implementado, fazer login automático com novo token:
// const loginResponse = await axios.post('/api/auth/login', {
//     email: userEmail,
//     password: userPassword
// });
// localStorage.setItem('token', loginResponse.data.token);
// window.location.href = '/dashboard';
```

---

## 🧪 Testes de Multi-Empresa

### Teste 1: Isolamento de Dados

```bash
# Terminal 1: Login como Empresa A
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa-a.com","password":"senha123"}' \
  > /tmp/token_a.json

TOKEN_A=$(cat /tmp/token_a.json | jq -r '.token')

# Terminal 2: Login como Empresa B
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa-b.com","password":"senha123"}' \
  > /tmp/token_b.json

TOKEN_B=$(cat /tmp/token_b.json | jq -r '.token')

# Terminal 3: Validar isolamento
echo "=== Com Token da Empresa A ==="
curl -X GET http://localhost:8080/api/configuracoes \
  -H "Authorization: Bearer $TOKEN_A" | jq '.empresaId'

echo "=== Com Token da Empresa B ==="
curl -X GET http://localhost:8080/api/configuracoes \
  -H "Authorization: Bearer $TOKEN_B" | jq '.empresaId'

# Devem retornar empresaIds diferentes!
```

### Teste 2: Proteção Contra Acesso Cruzado

```bash
# Obter ID de configuração da Empresa A
CONFIG_ID_A=$(curl -X GET http://localhost:8080/api/configuracoes \
  -H "Authorization: Bearer $TOKEN_A" | jq '.id')

# Tentar acessar com token da Empresa B (DEVE FALHAR!)
curl -X GET http://localhost:8080/api/configuracoes/$CONFIG_ID_A \
  -H "Authorization: Bearer $TOKEN_B"

# Se receber erro 403 ou 404, está funcionando corretamente!
```

---

## 📋 Checklist de Correção

### Imediato (Esta sessão)
- [ ] Corrigir `ConfiguracaoService.atualizarConfiguracao()` com validação de empresaId
- [ ] Criar Migration Flyway para sequence de ConfiguracaoSistema
- [ ] Verificar que SequenceGenerator tem `initialValue = 1`

### Frontend (CadastroEmpresa.jsx)
- [ ] Remover envio de `id: null` em formulário
- [ ] Adicionar logout automático após criar empresa
- [ ] Redirecionar para login para novo token

### Testes
- [ ] Executar teste de isolamento de dados
- [ ] Executar teste de proteção contra acesso cruzado
- [ ] Testar multi-empresa em produção antes de deploy

---

## 🔍 Debug: Como Verificar o Tenant Atual

### Método 1: Logs do TenantResolver

Os logs já exibem:
```
╔════════════════════════════════════════════════════════════╗
║ 🟢 RADAR SAAS: Liberando dados                             ║
║ Empresa ID: [1]                                            ║
║ Usuário: admin@empresa-a.com                               ║
╚════════════════════════════════════════════════════════════╝
```

### Método 2: Adicionar Debug em ConfiguracaoService

```java
public ConfiguracaoSistema obterConfiguracao() {
    Long empresaId = obterEmpresaIdDoUsuario();

    System.out.println("🔍 DEBUG: Buscando configuração para empresaId=" + empresaId);

    Optional<ConfiguracaoSistema> config = repository
        .findFirstByEmpresaIdOrderByIdDesc(empresaId);

    config.ifPresentOrElse(
        c -> System.out.println("✅ Configuração encontrada: ID=" + c.getId()),
        () -> System.out.println("❌ Nenhuma configuração encontrada. Criando...")
    );

    return config.orElseGet(() -> criarConfiguracaoPadraoParaEmpresa(empresaId));
}
```

### Método 3: Query Direto no Banco

```sql
-- Verificar dados de cada empresa
SELECT id, empresa_id, nome_fantasia FROM configuracoes_sistema;

-- Verificar sequência
SELECT * FROM pg_sequences WHERE sequencename = 'configuracoes_sistema_id_seq';

-- Resetar sequência se necessário
SELECT setval('configuracoes_sistema_id_seq', (SELECT MAX(id) FROM configuracoes_sistema) + 1);
```

---

## 📚 Referências de Código

- **TenantResolver**: `/src/main/java/com/grandport/erp/config/tenant/TenantResolver.java`
- **ConfiguracaoService**: `/src/main/java/com/grandport/erp/modules/configuracoes/service/ConfiguracaoService.java`
- **ConfiguracaoRepository**: `/src/main/java/com/grandport/erp/modules/configuracoes/repository/ConfiguracaoRepository.java`
- **BaseEntityMultiEmpresa**: `/src/main/java/com/grandport/erp/modules/multiEmpresa/BaseEntityMultiEmpresa.java`

---

**Status**: 🔄 Implementação em Progresso
**Próximo Passo**: Aplicar correções e executar testes

