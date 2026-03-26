# 🚀 REFERÊNCIA RÁPIDA - Copiar & Colar

## ⚡ Solução do Erro de Boleto (JÁ RESOLVIDO)

### pom.xml - Adicionar após caelum-stella-boleto

```xml
<!-- Dependências explícitas do iText 5 para suportar caelum-stella-boleto -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13.3</version>
</dependency>
```

---

## 🔐 Solução Multi-Empresa

### 1. ConfiguracaoService.java - Adicionar validação

**Localizar**: método `atualizarConfiguracao`
**Adicionar antes de `repository.save(config)`**:

```java
@Transactional
public ConfiguracaoSistema atualizarConfiguracao(ConfiguracaoSistema config) {
    Long empresaIdUsuario = obterEmpresaIdDoUsuario();

    // ← ADICIONE ISTO
    if (!empresaIdUsuario.equals(config.getEmpresaId())) {
        throw new SecurityException(
            "❌ Tentativa de alterar configuração de outra empresa! " +
            "Esperado: " + empresaIdUsuario + ", Recebido: " + config.getEmpresaId()
        );
    }

    return repository.save(config);
}
```

---

### 2. ConfiguracaoSistema.java - Corrigir SequenceGenerator

**Localizar**: Anotação `@SequenceGenerator`
**Adicionar**: `initialValue = 1`

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

---

### 3. Criar Migration Flyway

**Arquivo**: `src/main/resources/db/migration/V003__Fix_Configuracoes_Sequence.sql`

```sql
-- Criar sequência para configuracoes_sistema
CREATE SEQUENCE IF NOT EXISTS configuracoes_sistema_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Se a tabela já existe, atualizar default
ALTER TABLE configuracoes_sistema
    ALTER COLUMN id SET DEFAULT nextval('configuracoes_sistema_id_seq');
```

---

### 4. CadastroEmpresa.jsx - Logout após criar empresa

**Localizar**: Após `response = axios.post('/api/empresas'...`
**Adicionar**:

```javascript
// ✅ Após criar empresa com sucesso:
const response = await axios.post('/api/empresas', novaEmpresa);

// Fazer logout automático
localStorage.removeItem('token');
localStorage.removeItem('empresaId');
localStorage.removeItem('user');

// Redirecionar para login (após 1 segundo)
setTimeout(() => {
    window.location.href = '/login';
}, 1000);
```

---

## 🧪 Testes Rápidos

### Teste 1: Boleto
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/financeiro/boletos/1/gerar-pdf/1 \
  -o /tmp/boleto.pdf && file /tmp/boleto.pdf
# Esperado: PDF document, version 1.4
```

### Teste 2: Isolamento Multi-Empresa
```bash
# Token Empresa A
curl -H "Authorization: Bearer $TOKEN_A" \
  http://localhost:8080/api/configuracoes | jq '.empresaId'
# Esperado: 1

# Token Empresa B
curl -H "Authorization: Bearer $TOKEN_B" \
  http://localhost:8080/api/configuracoes | jq '.empresaId'
# Esperado: 2
```

### Teste 3: Lazy Loading
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/vendas/1 | jq '.itens | length'
# Esperado: número > 0 (sem erro)
```

---

## 📋 Checklist Rápido

- [ ] pom.xml - Adicionar itextpdf 5.5.13.3 ✅ (JÁ FEITO)
- [ ] ConfiguracaoService - Adicionar validação empresaId
- [ ] ConfiguracaoSistema - Adicionar initialValue = 1
- [ ] Migration Flyway - Criar V003__Fix_Configuracoes_Sequence.sql
- [ ] CadastroEmpresa.jsx - Logout após criar empresa
- [ ] Executar testes
- [ ] Build Maven: `mvn clean package -DskipTests`
- [ ] Deploy em homologação

---

## 🔧 Comandos Úteis

```bash
# Rebuild Maven
mvn clean package -DskipTests

# Ver árvore de dependências
mvn dependency:tree | grep itextpdf

# Executar testes
mvn test

# Deploy local
java -jar target/erp-core-0.0.1-SNAPSHOT.jar

# Query no banco - verificar sequence
SELECT * FROM pg_sequences WHERE sequencename = 'configuracoes_sistema_id_seq';

# Query - resetar sequence se necessário
SELECT setval('configuracoes_sistema_id_seq', (SELECT MAX(id) FROM configuracoes_sistema) + 1);
```

---

## 📞 Documentos Completos

- **RESOLUCAO_ERRO_BOLETO.md** - Detalhes técnicos
- **GUIA_MULTI_EMPRESA.md** - Implementação completa
- **DIAGNOSTICO_COMPLETO.md** - Análise de todos os problemas
- **STATUS_PROJETO.md** - Executive summary
- **CHECKLIST_ACOES.sh** - Script interativo

---

## 🎯 Ordem de Execução

1. **Aplicar correções** (pom.xml ✅, Java codes, SQL, JS)
2. **Build Maven** (`mvn clean package`)
3. **Executar testes** (isolamento, boleto, lazy loading)
4. **Deploy** (homologação → produção)

---

**Última Atualização**: 2026-03-26
**Status**: 60% Resolvido
**Próximo**: Aplicar correções acima

