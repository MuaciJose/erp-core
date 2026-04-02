# 🚀 Grandport ERP Core - Guia Completo de Instalação e Setup

Bem-vindo! Este é o guia oficial para configurar o ambiente de desenvolvimento do **Grandport ERP Core** após uma formatação de computador ou primeira instalação.

---

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Requisitos do Sistema](#requisitos-do-sistema)
3. [Guia Passo a Passo de Instalação](#guia-passo-a-passo-de-instalação)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Executando o Backend](#executando-o-backend)
6. [Executando o Frontend](#executando-o-frontend)
7. [Executando o Mobile](#executando-o-mobile)
8. [Verificando a Instalação](#verificando-a-instalação)
9. [Troubleshooting](#troubleshooting)
10. [Arquitetura do Projeto](#arquitetura-do-projeto)

---

## 🎯 Visão Geral do Projeto

**Grandport ERP Core** é um sistema ERP completo com:

- ✅ **Backend**: Java Spring Boot 4.0.3 (Multi-tenant)
- ✅ **Frontend Web**: React 19 + Vite + Tailwind CSS
- ✅ **Mobile**: React Native + Expo
- ✅ **Banco de Dados**: PostgreSQL 15
- ✅ **APIs**: WhatsApp (Evolution API), Fiscal (NFe)
- ✅ **Recursos**: Boletos, Contas Bancárias, Configurações Fiscais, PDV, e muito mais!

### Estrutura de Pastas

```
erp-core/
├── src/                          # Backend Java
│   ├── main/java/com/grandport/  # Código-fonte Java
│   ├── main/resources/           # Configurações, SQL, templates
│   └── test/                     # Testes unitários
├── grandport-frontend/           # Frontend Web (React + Vite)
├── grandport-mobile/             # App Mobile (React Native + Expo)
├── api-whatsapp/                 # Integração WhatsApp
├── evolution-api-folder/         # Evolution API (Docker)
├── schemas/                      # Schemas XML para NFe
├── pom.xml                       # Configuração Maven (Backend)
└── README.md                     # Este arquivo!
```

---

## 🖥️ Requisitos do Sistema

Antes de começar, certifique-se que seu computador atende estes requisitos:

### Obrigatório

| Software | Versão | Download |
|----------|--------|----------|
| **Java JDK** | 17 ou superior | https://www.oracle.com/java/technologies/downloads/ |
| **Node.js** | 18.x ou superior | https://nodejs.org/ |
| **PostgreSQL** | 14 ou 15 | https://www.postgresql.org/download/ |
| **Git** | Qualquer versão recente | https://git-scm.com/ |
| **Maven** | 3.8+ (incluso no projeto) | https://maven.apache.org/ |

### Opcional (mas recomendado)

| Software | Versão | Descrição |
|----------|--------|-----------|
| **Docker + Docker Compose** | Última | Para Evolution API (WhatsApp) |
| **IntelliJ IDEA** | Community/Ultimate | IDE recomendada para Java |
| **VS Code** | Última | Excelente para Frontend |
| **Expo CLI** | Última | Para trabalhar com Mobile |

### Verificando se já tem instalado

```bash
# Java
java -version

# Node.js e npm
node --version
npm --version

# PostgreSQL
psql --version

# Git
git --version

# Maven (opcional, projeto tem mvnw)
./mvnw --version
```

---

## 📥 Guia Passo a Passo de Instalação

### PASSO 1️⃣: Instalar as Ferramentas Necessárias

#### Windows:

```bash
# Instale os requisitos manualmente:
# 1. Java JDK 17: https://www.oracle.com/java/technologies/downloads/
# 2. Node.js: https://nodejs.org/
# 3. PostgreSQL: https://www.postgresql.org/download/
# 4. Git: https://git-scm.com/

# Após instalar, REINICIE SEU COMPUTADOR!

# Verifique no PowerShell ou CMD:
java -version
node --version
npm --version
psql --version
```

#### macOS:

```bash
# Use Homebrew para simplificar
brew install java17
brew install node
brew install postgresql
brew install git

# Após instalar, REINICIE SEU COMPUTADOR!

# Verifique:
java -version
node --version
npm --version
psql --version
```

#### Linux (Ubuntu/Debian):

```bash
# Atualize os repositórios
sudo apt-get update

# Instale as dependências
sudo apt-get install -y openjdk-17-jdk nodejs npm postgresql postgresql-contrib git

# Após instalar, REINICIE SEU COMPUTADOR!

# Verifique:
java -version
node --version
npm --version
psql --version
```

---

### PASSO 2️⃣: Clonar o Repositório

```bash
# Navegue até a pasta onde quer salvar o projeto
cd ~/Documentos  # ou qualquer pasta que preferir

# Clone o repositório
git clone https://github.com/seu-usuario/erp-core.git

# Entre no diretório do projeto
cd erp-core

# Verifique se tudo está aqui
ls -la
```

---

### PASSO 3️⃣: Configurar PostgreSQL

O PostgreSQL precisa estar rodando e com as credenciais corretas.

#### Iniciando o PostgreSQL

**Windows:**
- PostgreSQL já deve estar rodando como serviço
- Abra `psql` (deve vir no Menu Iniciar)

**macOS:**
```bash
# Se instalou com Homebrew
brew services start postgresql
# ou
postgres -D /usr/local/var/postgres
```

**Linux:**
```bash
# Inicie o serviço
sudo systemctl start postgresql
# Ou verifique se já está rodando
sudo systemctl status postgresql
```

#### Criar Banco de Dados e Usuário

```bash
# Conecte ao PostgreSQL como superusuário
psql -U postgres

# Dentro do psql, execute:
-- Criar banco de dados
CREATE DATABASE grandport_erp;

-- Verificar se foi criado
\l

-- Sair
\q
```

✅ **Pronto!** O banco de dados foi criado.

---

## 🐳 Deploy com Docker Compose

Guia operacional curto: [DEPLOY.md](/home/ubuntu/IdeaProjects/erp-core/DEPLOY.md)

Para homologacao/producao, o repositório agora assume Redis como dependencia obrigatoria da autenticacao segura. Nao dependa de lembrar disso manualmente: suba a stack completa.

### Passo rapido

```bash
cp .env.example .env
```

Preencha pelo menos:

```bash
JWT_SECRET=uma-chave-longa-e-segura
APP_API_BASE_URL=https://api.seu-dominio.com
APP_SECURITY_REDIS_REQUIRED=true
APP_SECURITY_COOKIE_SECURE=true
POSTGRES_PASSWORD=uma-senha-forte
```

Suba a stack:

```bash
docker compose up -d --build
```

### O que sobe

- `postgres`
- `redis`
- `erp-app`

### Comportamento esperado

- em `local/test`, Redis pode faltar e o sistema usa fallback em memoria
- em `hml/producao`, Redis deve existir
- se `APP_SECURITY_REDIS_REQUIRED=true` e Redis estiver indisponivel, a aplicacao falha no startup de forma intencional

### Variaveis criticas de producao

- `JWT_SECRET`
- `APP_SECURITY_REDIS_REQUIRED=true`
- `APP_SECURITY_COOKIE_SECURE=true`
- `APP_API_BASE_URL`
- `POSTGRES_PASSWORD`

### Healthchecks

O `docker-compose.yml` agora aguarda `postgres` e `redis` ficarem saudaveis antes de subir o app.

---

### PASSO 4️⃣: Configurar Variáveis de Ambiente

O projeto usa uma chave JWT para tokens. Configure-a:

### Padrão profissional de ambiente

- desenvolvimento local: `http://localhost:5173` -> `http://localhost:8080`
- homologacao/producao: dominio real com HTTPS
- IP da rede local: use apenas para testar celular/tablet, nao como padrao do dia a dia

#### Windows (PowerShell):

```powershell
# Defina a variável de ambiente
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "sua-chave-super-secreta-123", "User")

# Reinicie o PowerShell para que a variável seja aplicada
# Verifique:
$env:JWT_SECRET
```

#### macOS/Linux:

```bash
# Adicione ao seu shell profile (~/.bashrc, ~/.zshrc, ou ~/.bash_profile)
echo 'export JWT_SECRET="sua-chave-super-secreta-123"' >> ~/.bashrc

# Aplicar a mudança imediatamente
source ~/.bashrc

# Verifique:
echo $JWT_SECRET
```

---

### PASSO 5️⃣: Configurar o Backend (Java + Spring Boot)

```bash
# Entre no diretório do projeto
cd ~/Documentos/erp-core

# Compile o projeto (primeira vez leva alguns minutos)
./mvnw clean install -DskipTests

# Aguarde até ver "BUILD SUCCESS"
```

#### Se tiver erro de conexão com PostgreSQL:

Abra `src/main/resources/application.yaml` e verifique:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/grandport_erp
    username: postgres        # ← Altere se seu usuário é diferente
    password: admin           # ← Altere se sua senha é diferente
```

---

### PASSO 6️⃣: Configurar o Frontend Web

```bash
# Entre no diretório do frontend
cd grandport-frontend

# Instale as dependências
npm install

# Verifique se instalou corretamente
npm list
```

---

### PASSO 7️⃣: Configurar o Mobile (Opcional)

```bash
# Entre no diretório do mobile
cd ../grandport-mobile

# Instale as dependências
npm install

# Instale o Expo CLI globalmente
npm install -g expo-cli

# Verifique
expo --version
```

---

## 🗄️ Configuração do Banco de Dados

### Migrações Automáticas

O projeto usa **Flyway** para gerenciar migrações de banco de dados automaticamente. Quando o backend inicia, ele:

1. Verifica as migrações em `src/main/resources/db/migration/`
2. Executa as migrações pendentes
3. Cria/atualiza as tabelas automaticamente

**Nenhuma ação manual necessária!** Apenas certifique-se de que:
- ✅ PostgreSQL está rodando
- ✅ Banco `grandport_erp` foi criado
- ✅ Credenciais em `application.yaml` estão corretas

---

## 🚀 Executando o Backend

### Opção 1: Via Maven (Recomendado)

```bash
# Na raiz do projeto (onde está o pom.xml)
./mvnw spring-boot:run

# Aguarde aparecer algo como:
# ========================================
#  Tomcat started on port(s): 8080
# ========================================
```

### Opção 2: Via IDE (IntelliJ IDEA)

1. Abra o projeto em IntelliJ
2. Clique em `Run` → `Run 'Application'`
3. Aguarde a aplicação iniciar

### Verificar se Backend Iniciou Corretamente

Abra em seu navegador:
```
http://localhost:8080/swagger-ui.html
```

Se vir a documentação Swagger, ✅ **Backend está funcionando!**

---

## 🎨 Executando o Frontend Web

**Em outro terminal**, abra:

```bash
# Entre no diretório do frontend
cd grandport-frontend

# Inicie o servidor de desenvolvimento
npm run dev

# Aguarde aparecer algo como:
# ➜  Local:   http://localhost:5173/
```

Abra no navegador:
```
http://localhost:5173
```

---

## 📱 Executando o Mobile

**Em outro terminal**, abra:

```bash
# Entre no diretório do mobile
cd grandport-mobile

# Inicie o Expo
npm start

# Escolha a opção desejada:
# - Pressione 'w' para abrir no navegador
# - Pressione 'a' para abrir em emulador Android
# - Pressione 'i' para abrir em simulador iOS (macOS)
```

---

## ✅ Verificando a Instalação

Agora você deve ter:

- ✅ PostgreSQL rodando na porta 5432
- ✅ Backend rodando em `http://localhost:8080`
- ✅ Frontend rodando em `http://localhost:5173`
- ✅ Mobile rodando via Expo

### Teste rápido (5 minutos)

#### 1. Testar Backend

```bash
# Via curl ou Postman, faça um GET:
curl http://localhost:8080/swagger-ui.html

# Deve retornar HTML (interface Swagger)
```

#### 2. Testar Frontend

1. Abra `http://localhost:5173` no navegador
2. Você deve ver o login ou dashboard do ERP

#### 3. Testar Banco de Dados

```bash
# Conecte ao banco
psql -U postgres -d grandport_erp

# Verifique as tabelas criadas
\dt

# Saia
\q
```

---

## 🔧 Troubleshooting

### ❌ Erro: "Connection refused localhost:5432"

**Solução:**
- PostgreSQL não está rodando
- Use: `sudo systemctl start postgresql` (Linux) ou abra Services (Windows)
- Verifique a porta em `application.yaml`

### ❌ Erro: "Unexpected token" no Frontend

**Solução:**
```bash
cd grandport-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### ❌ Erro: "port 8080 already in use"

**Solução:**
```bash
# Mate o processo que está usando a porta
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8080
kill -9 <PID>
```

### ❌ Erro: "Migration failed"

**Solução:**
1. Verifique se o banco foi criado: `psql -U postgres -l`
2. Delete o banco e recrie:
   ```bash
   dropdb -U postgres grandport_erp
   createdb -U postgres grandport_erp
   ```
3. Reinicie o backend

### ❌ "Cannot find module" no Frontend

**Solução:**
```bash
cd grandport-frontend
npm install
```

---

## 🏗️ Arquitetura do Projeto

### Backend (Java Spring Boot)

```
src/main/java/com/grandport/erp/
├── config/              # Configurações (JWT, Segurança, Multi-tenant)
├── modules/
│   ├── usuario/         # Autenticação e Usuários
│   ├── financeiro/      # Contas Bancárias, Boletos, Extratos
│   ├── fiscal/          # NFe, XML, SEFAZ
│   ├── pdv/             # Ponto de Venda
│   ├── configuracoes/   # Configurações do Sistema
│   ├── multiEmpresa/    # Suporte Multi-tenant (SaaS)
│   └── ...
├── controller/          # Endpoints REST
├── service/             # Lógica de negócio
├── repository/          # Acesso ao banco (JPA)
├── model/               # Entidades JPA
└── exception/           # Exceções customizadas
```

### Frontend (React + Vite)

```
grandport-frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── modules/         # Páginas dos módulos
│   ├── services/        # Chamadas API (axios)
│   ├── contexts/        # Context API para estado
│   ├── hooks/           # Hooks customizados
│   ├── utils/           # Funções utilitárias
│   ├── App.jsx          # Componente raiz
│   └── main.jsx         # Entrada da aplicação
├── public/              # Assets estáticos
├── package.json         # Dependências npm
└── vite.config.js       # Configuração Vite
```

### Banco de Dados (PostgreSQL)

O Flyway cuida de criar as migrações:

```
src/main/resources/db/migration/
├── V1__Initial_Schema.sql
├── V2__Fix_Configuracoes_Sequence.sql
└── V3__...
```

---

## 📚 Documentação Adicional

Veja também:

- 📖 **STATUS_FINAL_MULTITENANT.txt** - Multi-tenant implementation
- 📖 **GUIA_TESTE_MODULO_BOLETO.md** - Teste do módulo de boletos
- 📖 **CORRECAO_MODULO_CONTAS_BANCARIAS.md** - Correções de contas bancárias
- 📖 **DOCUMENTACAO_FISCAL/** - Documentação de NF-e

---

## 🤝 Próximos Passos

1. ✅ Leia o `LEIA_PRIMEIRO.txt`
2. ✅ Configure suas credenciais de email em `application.yaml`
3. ✅ Estude os módulos (Financeiro, Fiscal, PDV)
4. ✅ Execute os testes unitários: `./mvnw test`
5. ✅ Comece a desenvolver!

---

## 💡 Dicas de Desenvolvimento

### Debug no Backend

Em `application.yaml`, altere o log level:

```yaml
logging:
  level:
    com.grandport: DEBUG
```

### Debug no Frontend

Use React DevTools (extensão do Chrome)

### Hot Reload

- **Backend**: Não automático, precisa reiniciar
- **Frontend**: Automático com Vite (save = reload)
- **Mobile**: Automático com Expo

### Commits Úteis

```bash
git add .
git commit -m "✨ Feature: descrição do que fez"
git push origin main
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o `Troubleshooting` acima
2. Leia a documentação do projeto
3. Abra uma issue no GitHub
4. Contate o time de desenvolvimento

---

## 📄 Licença

Este projeto é propriedade da Grandport. Acesso apenas para desenvolvedores autorizados.

---

## 🎉 Sucesso!

Parabéns! Você agora tem todo o ambiente pronto para desenvolver no Grandport ERP Core!

**Dúvidas? Comece pelo passo 1 e siga com cuidado!**

```
╔════════════════════════════════════════╗
║  Bem-vindo ao Grandport ERP Core! 🚀   ║
║  Happy Coding! 💻                      ║
╚════════════════════════════════════════╝
```
