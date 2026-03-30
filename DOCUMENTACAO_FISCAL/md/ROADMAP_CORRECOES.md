# 🗺️ ROADMAP E PRÓXIMOS PASSOS

Este documento detalha os problemas identificados e as correções necessárias.

---

## 📌 STATUS ATUAL (27/03/2026)

### ✅ O que está funcionando

- [x] Backend: Java Spring Boot 4.0.3
- [x] Frontend: React 19 + Vite
- [x] Mobile: React Native + Expo
- [x] Multi-tenant (SaaS) - Isolamento de empresas
- [x] Banco de dados: PostgreSQL
- [x] Autenticação JWT
- [x] Swagger API Documentation

### ⚠️ Problemas conhecidos

1. **Banco de Dados - Migrações Flyway**
   - Status: 🔴 CRÍTICO
   - Erro: `column "id" of relation "configuracoes_sistema" is an identity column`
   - Arquivo: `src/main/resources/db/migration/V2__Fix_Configuracoes_Sequence.sql`
   - Solução: Revisar e corrigir migrations

2. **Módulo: Contas Bancárias**
   - Status: 🟡 PARCIAL
   - Problema: Não consegue editar nem excluir no frontend
   - Arquivo: `grandport-frontend/src/modules/financeiro/ContasBancarias.jsx`
   - Erro: `Unexpected token (665:0)` - Erro de sintaxe

3. **Módulo: Boletos**
   - Status: 🟡 VERIFICAR
   - Documentação: `GUIA_TESTE_MODULO_BOLETO.md`
   - Próximo passo: Testar sincronização Frontend/Backend

---

## 🔧 CORREÇÕES NECESSÁRIAS

### PRIORIDADE 1: CRÍTICO (Faz app não iniciar)

#### 1.1 Migração Flyway Corrompida

**Arquivo afetado:**
```
src/main/resources/db/migration/V2__Fix_Configuracoes_Sequence.sql
```

**Problema:**
```
ERROR: column "id" of relation "configuracoes_sistema" is an identity column
```

**Ação necessária:**
```sql
-- ❌ ERRADO: Tentar adicionar sequence em coluna identity
ALTER COLUMN id ADD GENERATED ...

-- ✅ CORRETO: Remover sequência antiga se houver
-- DROP SEQUENCE IF EXISTS configuracoes_sistema_id_seq;
-- A coluna IDENTITY gerencia sua própria sequência
```

**Como corrigir:**
1. Abra `src/main/resources/db/migration/V2__Fix_Configuracoes_Sequence.sql`
2. Remova/comente linhas que tentam criar sequence
3. Teste: `./mvnw spring-boot:run`
4. Deve aparecer: `Successfully validated 1 migration`

---

### PRIORIDADE 2: ALTO (Funcionalidade quebrada)

#### 2.1 ContasBancarias - Erro de Sintaxe JSX

**Arquivo afetado:**
```
grandport-frontend/src/modules/financeiro/ContasBancarias.jsx
```

**Erro:**
```
[plugin:vite:react-babel] Unexpected token (665:0)
```

**Ação necessária:**

1. Abra o arquivo linha 665
2. Procure por:
   - Chaves não fechadas `{}`
   - Parênteses não fechados `()`
   - Tags JSX não fechadas `</>`

3. Exemplo típico:
```javascript
// ❌ ERRADO
export default {
    render() {
        return (
            <div>Conteúdo</div>
        );
    }
};  // ← Chave solitária causa erro na linha 665
```

**Como corrigir:**
1. Remova ou feche corretamente as estruturas
2. Use VS Code para auto-format: `Shift+Alt+F`
3. Teste: `npm run dev` no frontend
4. Deve compilar sem erros

---

#### 2.2 ContasBancarias - Funcionalidade Editar/Deletar

**Problema:**
- Botões de editar/deletar não funcionam no frontend

**Verificação necessária:**

```javascript
// Verifique se existem funções:
- handleEdit()
- handleDelete()

// Verifique se existem endpoints:
- PUT /api/contas-bancarias/{id}
- DELETE /api/contas-bancarias/{id}

// Verifique se API está respondendo
// Swagger: http://localhost:8080/swagger-ui.html
```

**Como corrigir:**

1. **Backend** - Verifique se endpoints existem:
```java
@PutMapping("/{id}")
public void atualizar(@PathVariable Long id, @RequestBody ContaBancaria conta) {
    // ...
}

@DeleteMapping("/{id}")
public void deletar(@PathVariable Long id) {
    // ...
}
```

2. **Frontend** - Verifique se chamadas foram feitas:
```javascript
const handleEdit = async (id) => {
    try {
        const response = await api.put(`/api/contas-bancarias/${id}`, data);
        // sucesso
    } catch (error) {
        // erro
    }
}

const handleDelete = async (id) => {
    try {
        const response = await api.delete(`/api/contas-bancarias/${id}`);
        // sucesso
    } catch (error) {
        // erro
    }
}
```

---

### PRIORIDADE 3: MÉDIO (Aprimoramentos)

#### 3.1 Sincronização Frontend/Backend - Boletos

**Status:** Verificar funcionamento

**Checklist de teste:**

```bash
# 1. Inicie backend
./mvnw spring-boot:run

# 2. Inicie frontend
cd grandport-frontend && npm run dev

# 3. Faça login: admin@empresa1.com / admin123

# 4. Navegue para: Módulo → Financeiro → Boletos

# 5. Teste:
- [ ] Listar boletos
- [ ] Criar novo boleto
- [ ] Editar boleto
- [ ] Deletar boleto
- [ ] Gerar PDF boleto

# 6. Verifique Swagger:
# http://localhost:8080/swagger-ui.html
# - Procure endpoints: /api/boletos
# - Teste cada um

# 7. Verifique console:
# - Frontend (F12): Procure por erros em vermelha
# - Backend (terminal): Procure por exceptions/errors
```

---

## 🚀 PLANO DE AÇÃO

### SEMANA 1: Corrigir Críticos

**Segunda-feira:**
- [ ] Corrigir migration Flyway V2
- [ ] Testar: `./mvnw clean install -DskipTests`
- [ ] Testar: `./mvnw spring-boot:run`

**Terça-feira:**
- [ ] Corrigir erro de sintaxe ContasBancarias.jsx
- [ ] Testar: `npm run dev` no frontend
- [ ] Verificar compilação sem warnings

**Quarta-feira:**
- [ ] Implementar handlers edit/delete ContasBancarias
- [ ] Criar/atualizar endpoints backend se necessário
- [ ] Testar CRUD completo

**Quinta-feira:**
- [ ] Sync Frontend/Backend Boletos
- [ ] Executar GUIA_TESTE_MODULO_BOLETO.md
- [ ] Documentar bugs encontrados

**Sexta-feira:**
- [ ] Code review
- [ ] Merge na main
- [ ] Deploy teste

---

### SEMANA 2: Aprimoramentos

- [ ] Melhorar tratamento de erros
- [ ] Adicionar mais validações
- [ ] Performance tuning
- [ ] Testes unitários

---

## 📋 CHECKLIST DE CORREÇÃO

### Backend

- [ ] Migration V2 corrigida
- [ ] Endpoints contasBancarias: GET, POST, PUT, DELETE
- [ ] Endpoints boletos: GET, POST, PUT, DELETE
- [ ] Tests: `./mvnw test` passando
- [ ] Sem warnings na compilação
- [ ] Swagger documentado

### Frontend

- [ ] ContasBancarias.jsx compilando
- [ ] Função handleEdit implementada
- [ ] Função handleDelete implementada
- [ ] Validações de formulário
- [ ] Mensagens de erro/sucesso
- [ ] Loading states

### Database

- [ ] Banco criado: `grandport_erp`
- [ ] Tabelas migradas com sucesso
- [ ] Dados de teste inseridos
- [ ] Backup realizado

---

## 🧪 TESTE RÁPIDO POS-CORREÇÃO

```bash
# 1. Compile
./mvnw clean install -DskipTests
# Esperado: BUILD SUCCESS

# 2. Rode backend
./mvnw spring-boot:run
# Esperado: Tomcat started on port 8080

# 3. Em outro terminal, rode frontend
cd grandport-frontend && npm run dev
# Esperado: Local: http://localhost:5173

# 4. Teste no navegador
# http://localhost:5173
# Login: admin@empresa1.com / admin123
# Teste: Financeiro → Contas Bancárias → CRUD
# Teste: Financeiro → Boletos → CRUD

# 5. Teste API Swagger
# http://localhost:8080/swagger-ui.html
# Teste cada endpoint

# 6. Verifique banco
psql -U postgres -d grandport_erp
SELECT COUNT(*) FROM contas_bancarias;
SELECT COUNT(*) FROM boletos;
\q
```

---

## 📊 METRICAS DE SUCESSO

| Métrica | Status Atual | Meta |
|---------|-------------|------|
| Backend builds | ❌ Erro Flyway | ✅ BUILD SUCCESS |
| Frontend compiles | ❌ Erro sintaxe | ✅ npm run dev sem erros |
| Contas Bancárias CRUD | ❌ Edit/Delete quebrados | ✅ 100% funcional |
| Boletos sincronizados | ⚠️ Não verificado | ✅ Frontend-Backend OK |
| Testes passando | ? Não rodado | ✅ 100% pass rate |

---

## 🤝 RESPONSABILIDADES

- **Backend (Java)**: Corrigir migrations, endpoints CRUD
- **Frontend (React)**: Corrigir sintaxe, handlers, integração API
- **Database**: Estrutura, migrações, dados teste
- **DevOps**: Deploy, CI/CD, infraestrutura

---

## 📞 PRÓXIMAS REUNIÕES

- [ ] Reunião: Revisar status correções (terça 14:00)
- [ ] Reunião: Validar funcionalidades (quarta 15:00)
- [ ] Reunião: Prepare deploy (sexta 11:00)

---

## 📝 NOTAS IMPORTANTES

1. **Não force push** - Use branches!
2. **Teste antes de commitar** - `./mvnw test`
3. **Documentar mudanças** - Use boas mensagens de commit
4. **Backup do banco** - Antes de fazer alterações estruturais
5. **Review de código** - Pair programming quando possível

---

## 🎯 META FINAL

✅ **Aplicação 100% funcional e sincronizada** até o final de março de 2026.

```
╔════════════════════════════════════════════════════╗
║  ✨ Roadmap Claro e Viável ✨                      ║
║                                                    ║
║  Prioridade → Ação → Teste → Deploy               ║
║                                                    ║
║  Let's Ship It! 🚀                                 ║
╚════════════════════════════════════════════════════╝
```

---

**Status: EM PROGRESSO** 🔄

Última atualização: 27/03/2026 11:15

