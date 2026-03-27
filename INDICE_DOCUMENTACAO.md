# 📖 ÍNDICE DE DOCUMENTAÇÃO

Bem-vindo! Este arquivo ajuda você a encontrar a documentação certa para cada situação.

---

## 🎯 COMEÇANDO DO ZERO (PRIMEIRA VEZ)

**Você acabou de clonar o projeto e não sabe por onde começar?**

👉 **Leia na seguinte ordem:**

1. **[README.md](./README.md)** - Visão geral completa do projeto (20 min)
2. **[GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)** - Passo a passo prático (30 min)
3. **[CHECKLIST_DESENVOLVIMENTO.md](./CHECKLIST_DESENVOLVIMENTO.md)** - Aprenda o dia-a-dia

---

## 🔥 PROBLEMAS? PROCURE AQUI

| Problema | Arquivo | Dica |
|----------|---------|------|
| "Connection refused localhost:5432" | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | PostgreSQL não está rodando |
| "Build SUCCESS but app won't start" | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Banco não foi criado |
| "Unexpected token" no Frontend | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Erro de sintaxe JSX |
| "npm: command not found" | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Node.js não instalado |
| Tudo está quebrado | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Seção "Se Tudo Falhar" |

---

## 📚 DOCUMENTAÇÃO DO PROJETO

### Geral
- **[README.md](./README.md)** - Visão geral, requisitos, arquitetura
- **[.env.example](./.env.example)** - Variáveis de ambiente necessárias

### Setup e Instalação
- **[GUIA_RAPIDO_SETUP.md](./GUIA_RAPIDO_SETUP.md)** - Guia passo a passo após formatar PC
- **[LEIA_PRIMEIRO.txt](./LEIA_PRIMEIRO.txt)** - Status do projeto, próximos passos

### Desenvolvimento
- **[CHECKLIST_DESENVOLVIMENTO.md](./CHECKLIST_DESENVOLVIMENTO.md)** - Checklist do dia-a-dia
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Resolução de problemas

### Documentação de Módulos
- **[DOCUMENTACAO_FISCAL/](./DOCUMENTACAO_FISCAL/)** - Documentação de NFe
- **[GUIA_TESTE_MODULO_BOLETO.md](./GUIA_TESTE_MODULO_BOLETO.md)** - Testes de boletos
- **[CORRECAO_MODULO_CONTAS_BANCARIAS.md](./CORRECAO_MODULO_CONTAS_BANCARIAS.md)** - Contas bancárias

---

## 🚀 RESUMO RÁPIDO

### Para Iniciar Tudo

```bash
# Terminal 1
./mvnw spring-boot:run

# Terminal 2
cd grandport-frontend && npm run dev

# Navegador
http://localhost:5173
```

### Credenciais Padrão

```
Email: admin@empresa1.com
Senha: admin123
```

### URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Aplicação web |
| Backend | http://localhost:8080 | API Java |
| Swagger | http://localhost:8080/swagger-ui.html | Documentação das APIs |
| Banco | localhost:5432 | PostgreSQL |

### Principais Pastas

```
erp-core/
├── src/                    ← Backend (Java)
├── grandport-frontend/     ← Frontend (React)
├── grandport-mobile/       ← App Mobile (React Native)
└── DOCUMENTACAO_FISCAL/    ← Documentação NFe
```

---

## 🎓 APRENDENDO ARQUITETURA

### Backend (Spring Boot)

1. Estude em: `src/main/java/com/grandport/erp/modules/`
2. Padrão MVC:
   - **Model**: `model/*.java` - Entidades do banco
   - **View**: Frontend React
   - **Controller**: `*Controller.java` - Endpoints REST
   - **Service**: `*Service.java` - Lógica de negócio
   - **Repository**: `*Repository.java` - Acesso ao banco

### Frontend (React)

1. Estude em: `grandport-frontend/src/modules/`
2. Estrutura recomendada:
   - `components/` - Componentes reutilizáveis
   - `pages/` - Páginas principais
   - `services/` - Chamadas API
   - `hooks/` - Hooks customizados

### Banco de Dados (PostgreSQL)

1. Migrações em: `src/main/resources/db/migration/`
2. Flyway gerencia automaticamente
3. Nenhuma ação manual necessária

---

## 🔐 SEGURANÇA

### Antes de Commitar

- [ ] Não commite `.env` ou `application.yaml` com dados reais
- [ ] Não commite senhas ou tokens
- [ ] Não commite arquivos de configuração local

### Configuração Segura

1. Use `.env.example` como modelo
2. Copie para `.env` local (já está em .gitignore)
3. Preencha com dados reais apenas no seu PC
4. Em produção, use variáveis de ambiente do servidor

---

## 🤝 FLUXO DE DESENVOLVIMENTO

```
1. Clone o projeto
   git clone ...

2. Configure ambiente
   - Java 17 ✅
   - Node.js ✅
   - PostgreSQL ✅
   - Variáveis de ambiente ✅

3. Inicie serviços
   - Backend: ./mvnw spring-boot:run
   - Frontend: npm run dev
   - Verifique: http://localhost:5173

4. Crie branch para sua feature
   git checkout -b feature/sua-feature

5. Desenvolva e teste
   - Escreva código
   - Execute testes: ./mvnw test
   - Teste manualmente no navegador

6. Commit e Push
   git commit -m "✨ Feature: descrição"
   git push origin feature/sua-feature

7. Abra Pull Request
   - No GitHub
   - Descreva suas mudanças
   - Aguarde review

8. Merge na main
   - Depois de aprovado
   - Alguém faz o merge
```

---

## 💻 COMANDOS MAIS USADOS

### Backend (Java)

```bash
# Compilar
./mvnw clean compile

# Instalar dependências
./mvnw clean install -DskipTests

# Rodar aplicação
./mvnw spring-boot:run

# Executar testes
./mvnw test

# Build para produção
./mvnw clean package
```

### Frontend (Node.js)

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview (testar build)
npm run preview

# Lint (verificar código)
npm run lint
```

### Git

```bash
# Criar branch
git checkout -b feature/nome

# Ver mudanças
git status
git diff

# Adicionar e commitar
git add .
git commit -m "Mensagem"

# Enviar
git push origin feature/nome

# Atualizar local
git pull origin main
```

### PostgreSQL

```bash
# Conectar
psql -U postgres

# Criar banco
CREATE DATABASE grandport_erp;

# Listar bancos
\l

# Sair
\q
```

---

## 🐛 Debug Rápido

### Backend Lento?

```bash
# Verifique os logs em src/main/resources/application.yaml
logging:
  level:
    com.grandport: DEBUG  # ← Aumente verbosidade
    org.hibernate.SQL: DEBUG
```

### Frontend com Erro?

```bash
# Abra DevTools
F12

# Procure em:
- Console: erros JavaScript
- Network: requisições HTTP
- Application: LocalStorage, Cookies
```

### Banco Corrompido?

```bash
# Recrie do zero
psql -U postgres
DROP DATABASE grandport_erp;
CREATE DATABASE grandport_erp;
\q

# Reinicie backend - Flyway recriará as tabelas
./mvnw spring-boot:run
```

---

## 📞 PRECISA DE AJUDA?

### 1️⃣ Procure no TROUBLESHOOTING.md
Provavelmente alguém já teve esse erro

### 2️⃣ Verifique o Checklist
Pode ser algo que esqueceu de fazer

### 3️⃣ Leia a documentação do módulo
Está em DOCUMENTACAO_FISCAL/ e GUIA_TESTE_*

### 4️⃣ Debug passo a passo
- Backend: Veja os logs com `log.debug()`
- Frontend: Use DevTools (F12)

### 5️⃣ Contate o time
Descreva o erro, os comandos que rodou, e o resultado esperado vs obtido

---

## 📊 ESTRUTURA DE ARQUIVOS

```
erp-core/
├── 📖 README.md                      ← Comece aqui!
├── 🚀 GUIA_RAPIDO_SETUP.md           ← Passo a passo
├── ✅ CHECKLIST_DESENVOLVIMENTO.md   ← Dia-a-dia
├── 🔧 TROUBLESHOOTING.md             ← Se der erro
├── 📚 DOCUMENTACAO_FISCAL/           ← NFe docs
│
├── src/                              ← Backend Java
│   ├── main/java/com/grandport/      ← Código-fonte
│   ├── main/resources/               ← Configurações
│   │   ├── application.yaml
│   │   └── db/migration/             ← SQL Migrations
│   └── test/                         ← Testes
│
├── grandport-frontend/               ← Frontend React
│   ├── src/
│   │   ├── modules/                  ← Páginas/Features
│   │   ├── components/               ← Componentes
│   │   └── services/                 ← APIs
│   └── package.json
│
├── grandport-mobile/                 ← App Mobile
│   └── package.json
│
├── pom.xml                           ← Dependências Java
└── .env.example                      ← Variáveis (template)
```

---

## 🎯 PRÓXIMOS PASSOS

- [ ] Leia o README.md
- [ ] Siga o GUIA_RAPIDO_SETUP.md
- [ ] Inicie Backend + Frontend
- [ ] Faça login
- [ ] Explore os módulos
- [ ] Leia CHECKLIST_DESENVOLVIMENTO.md antes de codar
- [ ] Comece a desenvolver!

---

## 🎉 VOCÊ ESTÁ PRONTO!

Parabéns por chegar até aqui! 🚀

Qualquer dúvida, recomece por este documento e procure a seção certa.

**Happy Coding!** 💻

---

## 📝 Última Atualização

- **Data**: 27 de Março de 2026
- **Versão**: 1.0
- **Status**: ✅ Completo

---

**📞 Dúvidas? Releia este índice e siga os links!**

