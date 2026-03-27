# 🚀 GUIA RÁPIDO - Após Formatar o PC

Você formatou seu computador e quer voltar a desenvolver o **Grandport ERP Core** rapidamente?

Este guia é específico para VOCÊ. Siga **exatamente** esta sequência.

---

## ⏱️ Tempo Estimado: 30 minutos

---

## 📋 Checklist Pré-Instalação

- [ ] PC formatado ✅
- [ ] Conectado à internet ✅
- [ ] Permissão de administrador (Windows) ✅
- [ ] GitHub configurado com suas chaves SSH (opcional mas recomendado)

---

## 🎯 FASE 1: Instalar Software Necessário (15 min)

### WINDOWS:

```powershell
# ABRA UM TERMINAL COMO ADMINISTRADOR!

# 1. Instale Chocolatey (gerenciador de pacotes)
Set-ExecutionPolicy AllSigned
iex ((New-Object System.Net.ServicePointManager).ServerCertificateValidationCallback = {$true}; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')))

# 2. Instale tudo em um comando
choco install -y openjdk17 nodejs postgresql git vscode docker-desktop

# 3. REINICIE SEU COMPUTADOR!
Restart-Computer

# 4. Após reiniciar, verifique:
java -version
node --version
npm --version
psql --version
git --version
```

### MACOS:

```bash
# 1. Instale Homebrew primeiro (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instale tudo
brew install openjdk@17 node postgresql git visual-studio-code docker

# 3. Link Java (importante!)
sudo ln -sfn /usr/local/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# 4. Inicie PostgreSQL
brew services start postgresql

# 5. REINICIE SEU COMPUTADOR!
sudo reboot

# 6. Após reiniciar, verifique:
java -version
node --version
npm --version
psql --version
git --version
```

### LINUX (Ubuntu/Debian):

```bash
# 1. Atualize repositórios
sudo apt-get update
sudo apt-get upgrade -y

# 2. Instale tudo
sudo apt-get install -y openjdk-17-jdk nodejs npm postgresql postgresql-contrib git

# 3. Inicie PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. REINICIE SEU COMPUTADOR!
sudo reboot

# 5. Após reiniciar, verifique:
java -version
node --version
npm --version
psql --version
git --version
```

---

## 🎯 FASE 2: Clonar Repositório (2 min)

```bash
# Abra o Terminal (qualquer SO)

# Navegue para onde quer salvar
cd ~/Documentos  # ou qualquer pasta

# Clone o projeto
git clone https://github.com/SeuUsuario/erp-core.git

# Entre no diretório
cd erp-core

# Verifique que tudo está aqui
ls -la
# Deve listar: README.md, pom.xml, src/, grandport-frontend/, etc.
```

---

## 🎯 FASE 3: Configurar PostgreSQL (3 min)

### 1. Criar Banco de Dados

```bash
# Conecte ao PostgreSQL
psql -U postgres

# Você entrará no prompt do PostgreSQL (psql=#)
# Execute os comandos abaixo:

-- Criar o banco
CREATE DATABASE grandport_erp;

-- Listar bancos (verifique se foi criado)
\l

-- Sair
\q
```

### 2. Verificar Credenciais

Abra o arquivo: `src/main/resources/application.yaml`

Procure por:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/grandport_erp
    username: postgres        # ← Seu usuário PostgreSQL
    password: admin           # ← Sua senha PostgreSQL
```

**Se sua senha é diferente de "admin", altere aqui!**

---

## 🎯 FASE 4: Configurar Variável JWT (1 min)

### WINDOWS:

```powershell
# ABRA UM NOVO TERMINAL COMO ADMINISTRADOR

# Defina a variável
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "sua-chave-mega-secreta-123", "User")

# Fecha e abre um novo terminal (importante!)
# Verifique:
echo $env:JWT_SECRET
```

### macOS/Linux:

```bash
# Abra seu arquivo de perfil
nano ~/.bashrc   # ou ~/.zshrc se usar zsh

# Adicione no final:
export JWT_SECRET="sua-chave-mega-secreta-123"

# Salve: CTRL+O, ENTER, CTRL+X

# Aplique:
source ~/.bashrc

# Verifique:
echo $JWT_SECRET
```

---

## 🎯 FASE 5: Compilar Backend (8 min)

```bash
# Na raiz do projeto (onde está pom.xml)
cd ~/Documentos/erp-core

# Compile tudo
./mvnw clean install -DskipTests

# Aguarde até ver:
# ========================================
# BUILD SUCCESS
# ========================================

# Se der erro, veja Troubleshooting mais abaixo
```

---

## 🎯 FASE 6: Instalar Dependências Frontend (5 min)

```bash
# Entre no frontend
cd grandport-frontend

# Instale
npm install

# Aguarde...
```

---

## ✨ PRONTO! Agora execute tudo

### Terminal 1: Backend

```bash
cd ~/Documentos/erp-core

./mvnw spring-boot:run

# Aguarde aparecer:
# ========================================
#  Tomcat started on port(s): 8080
# ========================================
# Deixe rodando!
```

### Terminal 2: Frontend

```bash
cd ~/Documentos/erp-core/grandport-frontend

npm run dev

# Aguarde aparecer:
# ➜  Local:   http://localhost:5173/
# Deixe rodando!
```

### Abra no Navegador:

```
http://localhost:5173
```

**PRONTO! Seu ERP está rodando! 🎉**

---

## 🔐 Fazer Login

Use as credenciais padrão (mude URGENTEMENTE em produção):

```
Email: admin@empresa1.com
Senha: admin123
```

---

## 📝 Estrutura que Deve Ver

### Backend (http://localhost:8080/swagger-ui.html):
- Documentação de todas as APIs
- Endpoints disponíveis
- Schemas de dados

### Frontend (http://localhost:5173):
- Tela de login
- Dashboard
- Módulos (Financeiro, Fiscal, PDV, etc.)

---

## ⚠️ Se Algo Deu Errado

### ❌ "Connection refused localhost:5432"
```bash
# PostgreSQL não está rodando

# Windows: Abra Services e procure por PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### ❌ "Migration failed"
```bash
# Recrie o banco:
psql -U postgres
DROP DATABASE grandport_erp;
CREATE DATABASE grandport_erp;
\q

# Tente novamente
./mvnw spring-boot:run
```

### ❌ "port 8080 already in use"
```bash
# Mate o processo na porta 8080

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process

# macOS/Linux:
lsof -i :8080
kill -9 <PID>
```

### ❌ "npm: command not found"
```bash
# Node.js não foi instalado corretamente
# Reinstale: https://nodejs.org/
# REINICIE o PC após instalar!
```

### ❌ "Unexpected token" no Frontend
```bash
cd grandport-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🎓 Próximos Passos Desenvolvimento

1. ✅ Leia o `README.md` completo (visão geral da arquitetura)
2. ✅ Abra o projeto em uma IDE:
   - **Backend**: IntelliJ IDEA (File → Open → erp-core)
   - **Frontend**: VS Code (File → Open Folder → erp-core/grandport-frontend)
3. ✅ Explore os módulos:
   - `src/main/java/com/grandport/erp/modules/`
4. ✅ Leia a documentação dos módulos
5. ✅ Comece a codar!

---

## 💡 Dicas Importantes

### Git Workflow

```bash
# Criar branch para feature
git checkout -b feature/nome-da-feature

# Fazer alterações, testar, depois:
git add .
git commit -m "✨ Feature: descrição"
git push origin feature/nome-da-feature

# Criar Pull Request no GitHub
```

### Hot Reload

- **Frontend**: Salvar arquivo = reload automático ✅
- **Backend**: Precisa reiniciar manualmente (Ctrl+C e rodar novamente)

### Debug

**Backend** (vejo os logs no terminal onde roda `mvnw spring-boot:run`)

**Frontend** (abro DevTools: F12 → Console)

---

## 📞 Encontrou Erro?

Verifique na ordem:

1. ✅ Todos os softwares estão instalados? (`java -version`, `node --version`, etc.)
2. ✅ PostgreSQL está rodando e banco `grandport_erp` foi criado?
3. ✅ Credenciais em `application.yaml` estão corretas?
4. ✅ Variável `JWT_SECRET` foi configurada?
5. ✅ `./mvnw clean install -DskipTests` rodou com sucesso?
6. ✅ Não há outro processo usando porta 8080 ou 5173?

Se ainda assim tiver problema, procure o erro específico neste arquivo ou no `README.md`.

---

## 🎉 Parabéns!

Você já tem o ambiente todo configurado! Agora é só codar!

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  ✨ BEM-VINDO AO GRANDPORT ERP CORE! ✨              ║
║                                                       ║
║  Backend:  http://localhost:8080  ✅                 ║
║  Frontend: http://localhost:5173  ✅                 ║
║                                                       ║
║  Happy Coding! 🚀                                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

**Dúvida? Releia este guia com calma, um passo por vez! 😊**

