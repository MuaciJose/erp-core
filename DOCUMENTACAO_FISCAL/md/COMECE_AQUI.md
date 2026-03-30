# 🎉 Grandport ERP Core - Bem-vindo!

Este é o repositório do **Grandport ERP Core**, um sistema ERP completo e moderno.

Se você **acabou de clonar este projeto** ou **formatou seu computador**, você está no lugar certo!

---

## 🚀 COMECE AQUI (2 minutos para começar)

### 1️⃣ Se é sua PRIMEIRA VEZ:

👉 **Leia nesta ordem:**

1. **[GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)** ← **COMECE AQUI!**
   - Guia passo a passo de 30 minutos
   - Específico para quem formatou o PC

2. Depois: **[README.md](./README.md)**
   - Visão geral completa do projeto

3. Depois: **[CHECKLIST_DESENVOLVIMENTO.md](./CHECKLIST_DESENVOLVIMENTO.md)**
   - Como trabalhar no dia-a-dia

### 2️⃣ Se encontrar ERRO:

👉 **Vá para:** **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
   - Solução para 99% dos erros comuns

### 3️⃣ Se não sabe onde está:

👉 **Consulte:** **[INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)**
   - Índice completo de toda documentação

---

## ⚡ QUICK START (5 minutos)

```bash
# Terminal 1: Backend (Java)
./mvnw spring-boot:run

# Terminal 2: Frontend (React)
cd grandport-frontend
npm run dev

# Browser: Acesse
http://localhost:5173

# Login com:
# Email: admin@empresa1.com
# Senha: admin123
```

---

## 🎯 O que é Grandport ERP?

Um **sistema ERP completo** com:

- ✅ **Backend**: Java Spring Boot 4.0.3 (Multi-tenant)
- ✅ **Frontend Web**: React 19 + Vite + Tailwind CSS
- ✅ **Mobile**: React Native + Expo
- ✅ **Banco de Dados**: PostgreSQL
- ✅ **APIs**: WhatsApp, Fiscal (NFe), Bancos
- ✅ **Módulos**: Financeiro, Fiscal, PDV, RH, e mais!

---

## 📋 Pré-Requisitos

**Obrigatório:**
- Java JDK 17 ou superior
- Node.js 18+ com npm
- PostgreSQL 14 ou 15
- Git

**Opcional:**
- Docker (para Evolution API - WhatsApp)
- IntelliJ IDEA (para backend)
- VS Code (para frontend)

---

## 📁 Estrutura do Projeto

```
erp-core/
├── 📖 GUIA_RAPIDO_SETUP.md          ← COMECE AQUI
├── 📖 README.md                      ← Leia depois
├── 🔧 TROUBLESHOOTING.md             ← Se der erro
├── ✅ CHECKLIST_DESENVOLVIMENTO.md   ← Dia-a-dia
├── 📚 INDICE_DOCUMENTACAO.md         ← Índice
├── 🗺️  ROADMAP_CORRECOES.md          ← Próximos passos
│
├── src/                              ← Backend Java
├── grandport-frontend/               ← Frontend React
├── grandport-mobile/                 ← App Mobile
├── DOCUMENTACAO_FISCAL/              ← Documentação NFe
└── pom.xml / package.json            ← Dependências
```

---

## 🎓 Próximos Passos

### 1. Primeiro Setup (se é a primeira vez)

```
⏱️  ~30 minutos

1. Clique em: GUIA_RAPIDO_SETUP.md
2. Siga cada passo
3. Teste Backend e Frontend
4. Faça login com credenciais padrão
```

### 2. Entender Estrutura

```
⏱️  ~30 minutos

1. Leia: README.md
2. Explore: src/main/java/com/grandport/erp/modules/
3. Explore: grandport-frontend/src/modules/
```

### 3. Começar a Desenvolver

```
⏱️  ~1 hora

1. Leia: CHECKLIST_DESENVOLVIMENTO.md
2. Crie uma branch: git checkout -b feature/nome
3. Comece a codar!
```

---

## 🔗 Documentação Importante

| Documento | Quando Usar |
|-----------|------------|
| [GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md) | Você formatou o PC |
| [README.md](./README.md) | Quer entender o projeto |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Algo deu erro |
| [CHECKLIST_DESENVOLVIMENTO.md](./CHECKLIST_DESENVOLVIMENTO.md) | Vai começar a codar |
| [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md) | Não sabe onde procurar |
| [ROADMAP_CORRECOES.md](./ROADMAP_CORRECOES.md) | Quer ver o que está quebrado |
| [.env.example](./.env.example) | Configurar variáveis |

---

## 🆘 Algo Deu Errado?

### ❌ "Connection refused localhost:5432"
→ PostgreSQL não está rodando. Veja **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

### ❌ "BUILD FAILURE"
→ Dependências não instaladas. Veja **[GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)**

### ❌ "npm: command not found"
→ Node.js não foi instalado. Veja **[GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)**

### ❌ "Cannot GET /"
→ Frontend não está rodando. Verifique terminal 2.

### ❌ Qualquer outro erro
→ Procure em **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

---

## 💡 Dicas Importantes

1. **Leia a documentação** antes de começar
2. **Use branches** para cada feature
3. **Teste antes de commitar**: `./mvnw test`
4. **DevTools abertos** durante desenvolvimento
5. **Logs são seus amigos**: `log.debug()` no backend
6. **Não commite `.env`** - já está em .gitignore

---

## 🌐 URLs Importantes

Durante desenvolvimento:

| Serviço | URL |
|---------|-----|
| 🎨 Frontend | http://localhost:5173 |
| 🔌 Backend API | http://localhost:8080 |
| 📚 API Docs | http://localhost:8080/swagger-ui.html |
| 🗄️ Banco de Dados | localhost:5432 |

---

## 👥 Credenciais Padrão

**Aviso:** Altere urgentemente em produção!

```
Email: admin@empresa1.com
Senha: admin123
```

---

## 🚀 Pronto para Começar?

### Opção 1: Primeira vez no projeto
👉 **Vá para:** [GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)

### Opção 2: Já é familiar com o projeto
👉 **Vá para:** [README.md](./README.md)

### Opção 3: Encontrou um erro
👉 **Vá para:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Opção 4: Perdido
👉 **Vá para:** [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)

---

## 📞 Suporte

- **Erro comum?** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Não acha documentação?** → [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)
- **Quer começar?** → [GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)
- **Quer aprender?** → [README.md](./README.md)

---

## ✨ Status do Projeto

| Componente | Status | Status |
|-----------|--------|--------|
| Backend (Java) | ⚠️ Verificar | Requer correção Flyway |
| Frontend (React) | ⚠️ Verificar | Erro em ContasBancarias.jsx |
| Mobile (React Native) | ✅ OK | Pronto |
| PostgreSQL | ✅ OK | Pronto |
| Banco de Dados | ✅ OK | Tabelas criadas |
| Multi-tenant | ✅ OK | Funcionando |
| Autenticação | ✅ OK | JWT implementado |

→ **Ver detalhes em:** [ROADMAP_CORRECOES.md](./ROADMAP_CORRECOES.md)

---

## 🎉 Você está pronto!

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     ✨ BEM-VINDO AO GRANDPORT ERP CORE! ✨           ║
║                                                       ║
║  Próximo passo: GUIA_RAPIDO_SETUP.md                ║
║                                                       ║
║  Happy Coding! 🚀                                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 📋 Documentação Rápida (TL;DR)

```bash
# 1. Instale tudo (Windows/macOS/Linux)
# Veja: GUIA_RAPIDO_SETUP.md (Fase 1)

# 2. Clone e configure
git clone https://github.com/seu-usuario/erp-core.git
cd erp-core

# 3. Crie banco de dados
psql -U postgres
CREATE DATABASE grandport_erp;
\q

# 4. Compile backend
./mvnw clean install -DskipTests

# 5. Instale frontend
cd grandport-frontend
npm install
cd ..

# 6. Terminal 1: Backend
./mvnw spring-boot:run

# 7. Terminal 2: Frontend
cd grandport-frontend
npm run dev

# 8. Abra navegador
# http://localhost:5173
# Login: admin@empresa1.com / admin123

# ✅ PRONTO! 🎉
```

---

**Data**: 27 de Março de 2026
**Versão**: 1.0
**Status**: ✅ Documentação Completa

**Dúvidas? Leia a documentação acima ou procure em TROUBLESHOOTING.md!**

