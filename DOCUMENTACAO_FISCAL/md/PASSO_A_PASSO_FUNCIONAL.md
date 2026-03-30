# ✅ CHECKLIST E PASSO-A-PASSO PARA DEIXAR O PROJETO 100% FUNCIONAL

## 🎯 Objetivo Final

**Sistema ERP Core PREMIUM** totalmente funcional com:
- ✅ Backend rodando em Java 17 + Spring Boot 4.0.3
- ✅ Frontend React compilando sem erros
- ✅ PostgreSQL sincronizado
- ✅ Todos os módulos funcionais (Boleto, Contas Bancárias, etc)

---

## 📍 ETAPA 1: LIMPEZA E PREPARAÇÃO

### 1.1 Remover artifatos anteriores
```bash
# Terminal
cd ~/IdeaProjects/erp-core

# Limpar tudo
rm -rf target/
rm -rf node_modules/
rm -rf dist/
rm -rf .next/
mvn clean
```

### 1.2 Verificar versões
```bash
# Verificar Java
java -version
# Esperado: openjdk version "17.0.x"

# Verificar Maven
mvn -version
# Esperado: Apache Maven 3.8.x

# Verificar Node
node -v
# Esperado: v18.x.x

npm -v
# Esperado: 9.x.x ou 10.x.x
```

---

## 📍 ETAPA 2: CORREÇÕES APLICADAS (Verificar)

### 2.1 Verificar pom.xml
```bash
# Abrir arquivo
nano pom.xml

# Procurar por:
# ✅ Uma única vez: spring-boot-starter-security
# ✅ Uma única vez: spring-boot-starter-validation
# ✅ Uma única vez: spring-boot-starter-web
# ✅ Uma única vez: spring-boot-starter-webmvc
# ✅ Uma única vez: springdoc-openapi-starter-webmvc-ui (versão 2.3.0)
# ✅ Deve ter: spring-boot-starter-thymeleaf
# ✅ Deve ter: spring-boot-starter-test
```

Checklist de deps críticas:
```xml
<!-- Devem estar PRESENTES -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>

<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13.3</version>
</dependency>

<dependency>
    <groupId>br.com.caelum.stella</groupId>
    <artifactId>caelum-stella-boleto</artifactId>
    <version>2.1.5</version>
</dependency>
```

### 2.2 Verificar application.properties
```bash
nano src/main/resources/application.properties
```

Deve conter:
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/erp_core
spring.datasource.username=erp_user
spring.datasource.password=ErpCore2026!@#
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Flyway
spring.flyway.enabled=true

# Server
server.port=8080
spring.application.name=erp-core
```

---

## 📍 ETAPA 3: COMPILAÇÃO BACKEND

### 3.1 Build passo 1: Validate
```bash
mvn validate

# Esperado: BUILD SUCCESS
# Se houver erro: revisar pom.xml
```

### 3.2 Build passo 2: Resolve Deps
```bash
mvn dependency:resolve

# Esperado: Baixa todas as dependências
# Pode levar 5-10 minutos na primeira vez
```

### 3.3 Build passo 3: Compile
```bash
mvn clean compile -DskipTests

# Esperado: BUILD SUCCESS
# Se houver erro: mvn compile -X (verbose)
```

### 3.4 Build passo 4: Package
```bash
mvn clean package -DskipTests

# Esperado: BUILD SUCCESS
# Arquivo gerado: target/erp-core-0.0.1-SNAPSHOT.jar
```

### 3.5 Testar JAR
```bash
# Listar JAR
ls -lah target/*.jar

# Esperado: arquivo de ~132 MB
```

---

## 📍 ETAPA 4: COMPILAÇÃO FRONTEND

### 4.1 Instalar deps
```bash
cd grandport-frontend
npm install

# Esperado: added XXX packages
# Pode levar 5-10 minutos
```

### 4.2 Build
```bash
npm run build

# Esperado: ✓ built in XXs
# Arquivo gerado: dist/
```

### 4.3 Verificar build
```bash
ls -la dist/
# Deve ter: index.html, assets/

# Deve estar sem erros tipo:
# [plugin:vite:react-babel] Unexpected token
```

---

## 📍 ETAPA 5: BANCO DE DADOS

### 5.1 Verificar PostgreSQL
```bash
# Verificar se está rodando
sudo systemctl status postgresql

# Se parado:
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5.2 Verificar banco
```bash
sudo -u postgres psql -l

# Deve mostrar:
# erp_core | erp_user | ...
```

### 5.3 Se banco não existe, criar:
```bash
sudo -u postgres psql

# Dentro do psql:
CREATE USER erp_user WITH PASSWORD 'ErpCore2026!@#';
ALTER USER erp_user CREATEDB SUPERUSER;
CREATE DATABASE erp_core OWNER erp_user;
GRANT ALL PRIVILEGES ON DATABASE erp_core TO erp_user;
\q
```

---

## 📍 ETAPA 6: EXECUTAR APLICAÇÃO

### 6.1 Terminal 1: Backend
```bash
cd ~/IdeaProjects/erp-core

# Opção A: Via Maven
mvn spring-boot:run

# OU Opção B: Via JAR
java -jar target/erp-core-0.0.1-SNAPSHOT.jar

# Esperado na console:
# Started Application in X seconds
# Listening on port 8080
```

### 6.2 Acessar Backend
```bash
# Em outro terminal:

# Verificar health
curl http://localhost:8080/actuator/health

# Resposta esperada:
# {"status":"UP"}

# Swagger
curl http://localhost:8080/swagger-ui/index.html

# Resposta: HTML da UI
```

### 6.3 Terminal 2: Frontend (Opcional)
```bash
cd ~/IdeaProjects/erp-core/grandport-frontend

# Modo desenvolvimento
npm run dev

# Esperado: Local: http://localhost:5173/
```

---

## 📍 ETAPA 7: TESTES FUNCIONAIS

### 7.1 Login
```bash
# Obter token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@erp.com",
    "password":"admin123"
  }' 2>/dev/null | jq .

# Resposta esperada:
# {
#   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "usuario": {...}
# }
```

### 7.2 Listar Contas Bancárias
```bash
# Copiar o TOKEN da resposta anterior
export TOKEN="seu_token_aqui"

# Listar
curl http://localhost:8080/api/financeiro/contas-bancarias \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | jq .

# Resposta esperada:
# [
#   {
#     "id": 1,
#     "nome": "Banco Brasil",
#     "saldoAtual": 1000.00,
#     ...
#   }
# ]
```

### 7.3 Criar Conta Bancária
```bash
curl -X POST http://localhost:8080/api/financeiro/contas-bancarias \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Itaú Business",
    "tipo": "BANCO",
    "numeroBanco": "341",
    "agencia": "0001",
    "numeroConta": "654321",
    "digitoConta": "5",
    "saldoAtual": 5000.00
  }' 2>/dev/null | jq .

# Resposta esperada: Conta criada com ID
```

### 7.4 Gerar Boleto PDF
```bash
# Assumindo que existe ContaReceber com ID 1
curl http://localhost:8080/api/financeiro/boletos/1/gerar-pdf/1 \
  -H "Authorization: Bearer $TOKEN" \
  --output boleto.pdf 2>/dev/null

# Verificar se foi criado
file boleto.pdf
# Esperado: application/pdf
```

### 7.5 Executar Testes Automatizados
```bash
# Todos os testes
mvn test

# Apenas testes de financeiro
mvn test -Dtest=*Financeiro*

# Com relatório de cobertura
mvn jacoco:report
```

---

## 📊 CHECKLIST FINAL

### Backend
- [ ] `mvn clean compile -DskipTests` passa sem erros
- [ ] `mvn package -DskipTests` gera JAR
- [ ] Aplicação inicia sem erros
- [ ] Health check retorna UP
- [ ] Swagger acessível
- [ ] Login funciona
- [ ] Endpoints retornam dados

### Frontend
- [ ] `npm install` completa sem erros
- [ ] `npm run build` gera dist/
- [ ] Sem erros de compilação Vite/React
- [ ] Componente ContasBancarias carrega
- [ ] UI não quebrada/alinhamento OK

### Banco de Dados
- [ ] PostgreSQL rodando
- [ ] Banco erp_core existe
- [ ] Migrações Flyway aplicadas
- [ ] Tabelas criadas (verificar via psql)

### Funcionalidades
- [ ] Listar contas bancárias funciona
- [ ] Criar conta bancária funciona
- [ ] Editar conta bancária funciona
- [ ] Deletar conta bancária funciona
- [ ] Transferência entre contas funciona
- [ ] Gerar boleto PDF funciona
- [ ] Módulo relatórios carrega
- [ ] WhatsApp integrado (se configurado)

---

## 🔴 TROUBLESHOOTING

### Erro: Cannot find symbol class Valid

**Causa**: Import incorreto  
**Solução**:
```java
// Remover:
import javax.validation.Valid;

// Usar:
import jakarta.validation.Valid;
```

### Erro: Package org.thymeleaf does not exist

**Causa**: Dependência faltando  
**Solução**: Adicionar ao pom.xml
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

### Erro: Duplicate declaration of version

**Causa**: Dependência declarada duas vezes  
**Solução**: Remover uma das duplicatas

### Erro: Port 8080 already in use

**Causa**: Outra app rodando na porta  
**Solução**:
```bash
# Mudar em application.properties:
server.port=8081

# OU matar processo:
lsof -i :8080
kill -9 <PID>
```

### Erro: PostgreSQL connection refused

**Causa**: Banco não está rodando  
**Solução**:
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Erro: Frontend: Unexpected token

**Causa**: Sintaxe JSX incorreta  
**Solução**: Verificar arquivo, procurar por chaves desbalanceadas
```bash
npm run build  # Mostra exatamente onde está o erro
```

---

## 📱 PRÓXIMAS FASES: PREMIUM

Após passar em todos os testes:

### Phase 1: Code Quality
```bash
mvn spotbugs:check
mvn pmd:check
mvn checkstyle:check
```

### Phase 2: Security
```bash
mvn org.owasp:dependency-check-maven:check
```

### Phase 3: Performance
```bash
# Cache Redis
# Batch processing
# Query optimization
```

### Phase 4: Deployment
```bash
# Docker build
docker build -t erp-core:latest .
docker run -p 8080:8080 erp-core:latest

# Docker Compose
docker-compose up -d
```

---

**Status**: ✅ PRONTO PARA DESENVOLVIMENTO  
**Data**: 2026-03-30  
**Próximo passo**: Executar `mvn clean compile -DskipTests`

