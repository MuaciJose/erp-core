# ✅ CHECKLIST DE DESENVOLVIMENTO

Guia rápido para não esquecer nada ao desenvolver no Grandport ERP Core.

---

## 🚀 COMEÇAR O DIA

- [ ] Abra 2 terminais
- [ ] Terminal 1: `./mvnw spring-boot:run` (backend)
- [ ] Terminal 2: `cd grandport-frontend && npm run dev` (frontend)
- [ ] Aguarde ambos iniciarem
- [ ] Abra `http://localhost:5173` no navegador
- [ ] Faça login com `admin@empresa1.com` / `admin123`

---

## 💻 ANTES DE COMEÇAR A CODAR

- [ ] Crie uma branch nova: `git checkout -b feature/seu-feature`
- [ ] Nunca commite na `main` direto!
- [ ] Atualize o código local: `git pull origin main`

---

## 📝 DURANTE O DESENVOLVIMENTO

### Backend (Java)

- [ ] Abra `src/main/java/com/grandport/erp/modules/`
- [ ] Entenda o padrão MVC:
  - `model/` = Entidades JPA
  - `controller/` = Endpoints REST
  - `service/` = Lógica de negócio
  - `repository/` = Acesso ao banco

**Padrão a seguir:**
```java
// ❌ ERRADO - Lógica no Controller
@PostMapping
public void save(@RequestBody Data data) {
    db.save(data); // EVITE ISSO!
}

// ✅ CORRETO - Lógica no Service
@PostMapping
public void save(@RequestBody Data data) {
    service.save(data); // USE ISSO!
}
```

- [ ] Adicione logs: `log.info("Mensagem")` para debug
- [ ] Teste suas mudanças: `./mvnw test`
- [ ] Quando mudar Java, o servidor não recarrega:
  1. Pare-o: `CTRL+C`
  2. Recompile: `./mvnw clean compile`
  3. Reinicie: `./mvnw spring-boot:run`

### Frontend (React)

- [ ] Abra `grandport-frontend/src/modules/`
- [ ] Estrutura recomendada:
  ```
  modules/
  ├── moduloName/
  │   ├── components/        # Componentes do módulo
  │   ├── pages/            # Páginas principais
  │   ├── services/         # Chamadas API
  │   ├── hooks/            # Hooks customizados
  │   └── utils/            # Funções utilitárias
  ```

- [ ] Use componentes reutilizáveis
- [ ] Importe de `components/` quando possível
- [ ] Use Tailwind para estilização:
  ```jsx
  // ❌ ERRADO
  <div style={{color: 'blue'}}>Texto</div>

  // ✅ CORRETO
  <div className="text-blue-600">Texto</div>
  ```

- [ ] Sempre use `try/catch` em API calls:
  ```javascript
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Algo deu errado!');
  }
  ```

- [ ] Salvar arquivo = reload automático ✅ (Hot reload)

---

## 🧪 TESTANDO

### Teste do Backend

```bash
# Rodar todos os testes
./mvnw test

# Rodar um teste específico
./mvnw test -Dtest=NomeDoTest

# Com cobertura
./mvnw clean test jacoco:report
```

### Teste do Frontend

```bash
# Abra DevTools: F12
# Vá em Console para ver erros
# Vá em Network para ver requisições

# Teste manual:
# 1. Faça login
# 2. Navegue entre páginas
# 3. Teste CRUD (Criar, Ler, Atualizar, Deletar)
# 4. Verifique se os dados aparecem corretamente
```

### Teste da API via Swagger

```
http://localhost:8080/swagger-ui.html
```

Todos os endpoints estão documentados lá!

---

## 🐛 DEBUG

### Backend

1. Abra o arquivo Java
2. Clique à esquerda da linha (crie um breakpoint)
3. Rode em modo debug:
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.fork=false
   ```
4. A execução vai pausar quando chegar no breakpoint
5. Inspect variáveis

### Frontend

1. Abra DevTools: `F12`
2. Vá em "Sources"
3. Encontre seu arquivo `.jsx`
4. Clique à esquerda para criar breakpoint
5. Recarregue a página: `F5`
6. Execute passo a passo

---

## 🔒 MULTI-TENANT (Importante!)

Este sistema é **multi-tenant**. Significa que cada empresa tem seus dados isolados.

### Importante ao programar:

```java
// ❌ ERRADO - Ignora empresa do usuário
SELECT * FROM usuarios;

// ✅ CORRETO - Filtra por empresa
SELECT * FROM usuarios WHERE empresa_id = :empresaId;
```

**O sistema faz isso automaticamente em `BaseEntityMultiEmpresa`**

Mas sempre pense:
- "Este dado pertence a qual empresa?"
- "O usuário de outra empresa pode ver isto?"

---

## 📦 COMMITANDO

### Regra #1: Commit frequente e pequeno

```bash
# ❌ ERRADO
git add .
git commit -m "Fiz tudo"

# ✅ CORRETO
git add src/modules/financeiro
git commit -m "✨ Feature: Add edição de contas bancárias"

git add grandport-frontend/src/modules/financeiro
git commit -m "🎨 UI: Atualizar formulário de contas bancárias"
```

### Mensagem de Commit

```
✨ Feature: descrição do que foi feito
🐛 Fix: corrigiu um bug
🎨 UI: melhorias visuais
📚 Docs: atualizar documentação
🧪 Test: adicionar testes
🔧 Refactor: reorganizar código
```

### Processo Correto

```bash
# 1. Verifique mudanças
git status

# 2. Adicione mudanças por tipo
git add src/

# 3. Commit com mensagem clara
git commit -m "✨ Feature: criar módulo de contas bancárias"

# 4. Envie para repositório
git push origin feature/sua-feature

# 5. Abra Pull Request no GitHub
# No GitHub: New Pull Request → seu branch
```

---

## 🚀 ENVIANDO PARA PRODUÇÃO

### Checklist de Deploy

- [ ] Todos os testes passando: `./mvnw test`
- [ ] Sem erros de compilação: `./mvnw clean install`
- [ ] Sem erros no frontend: `npm run build`
- [ ] Código revisado (Pull Request aprovado)
- [ ] Banco de dados preparado (migrações Flyway)
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco feito

### Comandos de Build

```bash
# Backend
./mvnw clean package

# Isso vai gerar:
# target/erp-core-0.0.1-SNAPSHOT.jar

# Frontend
cd grandport-frontend
npm run build

# Isso vai gerar:
# dist/ (pasta com HTML/CSS/JS otimizados)
```

---

## ❌ ERROS COMUNS A EVITAR

- [ ] ❌ Commitar `.env` ou `application.yaml` com dados reais
- [ ] ❌ Fazer `git push` sem testar antes
- [ ] ❌ Alterar SQL migrations já feitas (crie nova)
- [ ] ❌ Usar `throw new Exception()` genérico (use custom exceptions)
- [ ] ❌ Deixar `TODO` ou `FIXME` comentários sem resolver
- [ ] ❌ Código não formatado (use IDE para auto-format)
- [ ] ❌ Variáveis com nomes confusos (`x`, `temp`, etc.)
- [ ] ❌ Copiar/colar código - refatore para reutilizar

---

## 📚 REFERÊNCIAS RÁPIDAS

### Estrutura de Pasta - Módulo Novo

```java
// BACKEND
src/main/java/com/grandport/erp/modules/seumodulo/
├── SeuModuloController.java      // Endpoints REST
├── SeuModuloService.java         // Lógica
├── model/
│   └── SeuModulo.java            // Entidade JPA
├── repository/
│   └── SeuModuloRepository.java   // BD Access
└── dto/
    ├── SeuModuloDTO.java         // Request/Response
    └── SeuModuloCriacaoDTO.java   // Para criar
```

### Padrão REST

```
GET    /api/seu-modulo           → Listar
GET    /api/seu-modulo/{id}      → Detalhe
POST   /api/seu-modulo           → Criar
PUT    /api/seu-modulo/{id}      → Atualizar
DELETE /api/seu-modulo/{id}      → Deletar
```

---

## 🎯 FIM DO DIA

Antes de sair:

- [ ] Todos testes passando: `./mvnw test`
- [ ] Código commitado: `git status` (vazio)
- [ ] Código enviado: `git log` (seu commit está lá)
- [ ] Branch salvo: `git branch` (seu branch existe)
- [ ] Documenta o que fez em um comentário/PR

---

## 💡 DICAS OURO

1. **Compile frequentemente**: `./mvnw clean compile` (5-10s)
   - Evita surpresas na hora de testar

2. **Use o Swagger**: `http://localhost:8080/swagger-ui.html`
   - Teste suas APIs lá antes de testar no frontend

3. **Logs são seus amigos**: `log.debug()`, `log.info()`, `log.error()`
   - Facilita debug

4. **Git branching**: Sempre crie branch para cada feature
   - Facilita reverter se necessário

5. **Code review**: Peça ajuda de colegas
   - 2 olhos veem mais que 1

---

**Bom desenvolvimento! 🚀**

