# 🔧 Troubleshooting Avançado

Este documento ajuda a resolver problemas comuns de forma estruturada.

---

## 🔍 Diagnosticar o Problema

### Passo 0: Verifique o que está rodando

```bash
# WINDOWS (PowerShell):
Get-Process | Where-Object {$_.ProcessName -like "*java*" -or $_.ProcessName -like "*node*"}

# macOS/Linux:
ps aux | grep -E "java|node"
```

---

## ❌ ERROS NA COMPILAÇÃO

### Erro: "Could not find artifact org.springframework.boot:spring-boot-starter-parent:4.0.3"

**Causa**: Maven não conseguiu baixar dependências

**Solução**:
```bash
# Limpe cache Maven
rm -rf ~/.m2/repository

# Tente novamente (vai demorar um pouco)
./mvnw clean install -DskipTests
```

---

### Erro: "JAVA_HOME is not set"

**Causa**: Java não foi instalado ou variável de ambiente não configurada

**Solução**:

**Windows:**
```powershell
# Localize Java
Get-ChildItem "C:\Program Files\Java" -Directory

# Configure JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17.x.x", "User")

# Reinicie o terminal
```

**macOS:**
```bash
# Encontre Java
/usr/libexec/java_home -v 17

# Configure no ~/.bashrc ou ~/.zshrc
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo $JAVA_HOME
```

**Linux:**
```bash
# Encontre Java
update-java-alternatives -l

# Configure
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

---

### Erro: "No plugin found for prefix 'spring-boot' in the current project"

**Causa**: spring-boot-maven-plugin não foi encontrado

**Solução**:
```bash
# Use o Maven wrapper (mais confiável):
./mvnw spring-boot:run

# Não use:
mvn spring-boot:run  # ← ERRADO
```

---

## ❌ ERROS NO BANCO DE DADOS

### Erro: "Connection refused localhost:5432"

**Causa**: PostgreSQL não está rodando

**Verificação**:
```bash
# WINDOWS:
netstat -ano | findstr :5432

# macOS:
lsof -i :5432

# Linux:
sudo netstat -tulpn | grep 5432
```

**Solução**:

```bash
# Windows:
# 1. Abra "Services" (Win+R, services.msc)
# 2. Procure "PostgreSQL"
# 3. Se não estiver iniciado, clique em "Start"

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Para iniciar sempre
```

---

### Erro: "ERROR: relation 'usuarios' does not exist"

**Causa**: Banco foi criado mas tabelas não foram migradas

**Verificação**:
```bash
# Conecte ao banco
psql -U postgres -d grandport_erp

# Verifique se há tabelas
\dt

# Se estiver vazio, o problema é este
\q
```

**Solução**:
1. Certifique-se de que o backend iniciou sem erros
2. Verifique se as migrações Flyway foram executadas
3. Se não, tente:

```bash
# Reinicie o backend e observar os logs
./mvnw spring-boot:run

# Procure por:
# "Successfully validated 1 migration"
# "Schema "public" successfully baseline at version 1"
```

---

### Erro: "column 'id' of relation 'configuracoes_sistema' is an identity column"

**Causa**: Conflito em migrações Flyway

**Solução**:
```bash
# Recrie o banco
psql -U postgres

DROP DATABASE grandport_erp;
CREATE DATABASE grandport_erp;
\q

# Tente novamente
./mvnw spring-boot:run
```

---

### Erro: "FATAL: sorry, too many clients already connected"

**Causa**: Muitas conexões abertas no PostgreSQL

**Solução**:
```bash
# Reinicie PostgreSQL

# macOS:
brew services restart postgresql

# Linux:
sudo systemctl restart postgresql

# Windows:
# Services → PostgreSQL → Restart
```

---

## ❌ ERROS NA PORTA

### Erro: "Address already in use :8080"

**Causa**: Outro processo está usando a porta 8080

**Encontrar e matar o processo**:

```bash
# Windows (PowerShell):
$port = 8080
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    $pid = $process.OwningProcess
    Stop-Process -Id $pid -Force
    Write-Host "Processo $pid encerrado"
} else {
    Write-Host "Nenhum processo na porta $port"
}

# macOS/Linux:
lsof -i :8080
# Anote o PID
kill -9 <PID>
```

---

### Erro: "Cannot assign requested address :8080"

**Causa**: Interface de rede incorreta

**Solução**:

Abra `src/main/resources/application.yaml` e adicione:

```yaml
server:
  address: localhost
  port: 8080
```

---

## ❌ ERROS NO FRONTEND

### Erro: "Failed to resolve module '@/components/...'"

**Causa**: Alias não está configurado em vite.config.js

**Solução**:

Abra `grandport-frontend/vite.config.js` e verifique:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### Erro: "Unexpected token (linha:coluna)"

**Causa**: Erro de sintaxe JavaScript/JSX

**Solução**:

1. Abra a linha indicada
2. Procure por:
   - Chaves não fechadas `{` `}`
   - Parênteses não fechados `(` `)`
   - Aspas não fechadas `"` `'`
   - Ponto e vírgula faltante `;`

Exemplo do erro anterior:
```javascript
// ❌ ERRADO
const Component = () => {
    return (
        <div>Conteúdo</div>
    );  // ← Falta fechar a função
};  // ← Chave solitária aqui causava o erro
```

---

### Erro: "Cannot GET /"

**Causa**: Frontend não está iniciado ou está na porta errada

**Verificação**:
```bash
# O frontend deve estar rodando em:
http://localhost:5173

# Não é:
http://localhost:8080  # ← Isso é o backend!
```

**Solução**:
```bash
cd grandport-frontend
npm run dev
```

---

### Erro: "npm: command not found"

**Causa**: Node.js não foi instalado

**Solução**:
1. Reinstale Node.js: https://nodejs.org/
2. **REINICIE O COMPUTADOR!** (importante)
3. Verifique:
```bash
node --version
npm --version
```

---

### Erro: "Module not found" (axios, react-router, etc.)

**Causa**: package.json não foi instalado ou está desatualizado

**Solução**:
```bash
cd grandport-frontend

# Limpe cache npm
npm cache clean --force

# Instale novamente
rm -rf node_modules package-lock.json
npm install

# Verifique
npm list
```

---

## ❌ ERROS DE AUTENTICAÇÃO

### Erro: "401 Unauthorized"

**Causa**: Token JWT inválido ou expirado

**Solução**:

1. Faça logout e login novamente
2. Verifique se `JWT_SECRET` está configurado:

```bash
# Windows:
echo $env:JWT_SECRET

# macOS/Linux:
echo $JWT_SECRET
```

3. Se não houver saída, configure novamente (veja Guia Rápido)

---

### Erro: "403 Forbidden"

**Causa**: Você não tem permissão para acessar este recurso

**Verificação**:
- Qual é seu usuário?
- Qual é sua empresa?
- Qual permissão seu usuário tem?

**Solução**: Verifique as permissões do usuário no banco de dados:

```bash
psql -U postgres -d grandport_erp

-- Verifique usuários
SELECT * FROM usuarios WHERE email = 'seu-email@empresa.com';

-- Verifique permissões
SELECT * FROM permissoes WHERE usuario_id = <id>;

\q
```

---

## ❌ ERROS DE MULTI-TENANT

### Erro: "assigned tenant id differs from current tenant id [1 != 2]"

**Causa**: Você está tentando acessar dados de outra empresa

**Verificação**:
- Qual empresa está logada?
- Qual empresa esses dados pertencem?

**Solução**:
1. Faça logout
2. Faça login com a empresa correta
3. Tente novamente

---

### Erro: "SecurityContextHolder does not contain a valid Authentication"

**Causa**: Você não está logado

**Solução**:
1. Verifique se o token está sendo enviado no header:
```javascript
// ❌ ERRADO:
axios.get('/api/dados')

// ✅ CORRETO:
axios.get('/api/dados', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

2. Faça login novamente

---

## ❌ ERROS DE PERFORMANCE

### Sintoma: Frontend muito lento

**Causa**: Muitas requisições sendo feitas ao mesmo tempo

**Verificação**:
1. Abra DevTools (F12)
2. Vá para "Network"
3. Procure por:
   - Requisições que demoram muito (>5s)
   - Muitas requisições iguais

**Solução**:
- Adicione caching
- Reduza o número de requisições
- Use debounce/throttle
- Otimize queries no backend

---

### Sintoma: Backend muito lento

**Causa**: Queries lentas no banco de dados

**Verificação**:
1. Observe os logs: `./mvnw spring-boot:run`
2. Procure por: `Hibernate: SELECT ...` que demora muito

**Solução**:
```bash
# Ative logs SQL em application.yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

Isso vai mostrar exatamente qual query está lenta.

---

## ✅ VERIFICAÇÕES RÁPIDAS

### Tudo está funcionando?

```bash
# 1. PostgreSQL rodando?
psql -U postgres -c "SELECT 1"
# Deve retornar: 1

# 2. Backend rodando?
curl http://localhost:8080/swagger-ui.html
# Deve retornar HTML

# 3. Frontend rodando?
curl http://localhost:5173
# Deve retornar HTML

# 4. Variáveis de ambiente?
echo $JWT_SECRET
# Deve ter um valor
```

---

## 📞 Se Tudo Falhar

1. **Limpe tudo:**
   ```bash
   # Backend
   ./mvnw clean
   rm -rf target
   rm -rf ~/.m2/repository

   # Frontend
   cd grandport-frontend
   rm -rf node_modules package-lock.json

   # Banco
   psql -U postgres
   DROP DATABASE grandport_erp;
   CREATE DATABASE grandport_erp;
   \q
   ```

2. **Reinstale:**
   ```bash
   ./mvnw clean install -DskipTests
   cd grandport-frontend
   npm install
   ```

3. **Reinicie tudo:**
   - PostgreSQL
   - Terminal
   - Computador (se necessário)

4. **Tente novamente:**
   ```bash
   ./mvnw spring-boot:run
   ```

---

## 📝 Coletando Informações para Suporte

Se ainda assim não funcionar, reúna:

1. Sua saída de `./mvnw spring-boot:run` (últimas 50 linhas)
2. Sua saída de `npm run dev` (se erro no frontend)
3. Saída de:
   ```bash
   java -version
   node --version
   npm --version
   psql --version
   git --version
   ```
4. Seu sistema operacional e versão

---

## 💡 Dicas Finais

- **Não adicione `-DskipTests` depois da compilação** funcionar - os testes ajudam a detectar problemas
- **Não altere application.yaml sem motivo** - preferência por variáveis de ambiente
- **Commits frequentes** - facilita encontrar o que quebrou
- **Use branches** - nunca commite diretamente na main

---

**Boa sorte! 🍀**

