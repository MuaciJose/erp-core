# 🚀 GUIA COMPLETO DE SETUP - ERP CORE PREMIUM

## 📋 PASSO-A-PASSO: Do Zero ao 100%

### **FASE 1: PREPARAÇÃO DA MÁQUINA**

#### 1.1 Requisitos do Sistema
```bash
# Verificar requisitos mínimos
- Java 17+ (JDK)
- Maven 3.8+
- Node.js 18+
- PostgreSQL 12+
- Git
```

#### 1.2 Instalar Java 17
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk openjdk-17-jre-headless

# Verificar
java -version
```

#### 1.3 Instalar Maven
```bash
# Ubuntu/Debian
sudo apt install maven

# Ou via SDKMAN (recomendado)
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install maven 3.9.6
```

#### 1.4 Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### **FASE 2: CLONAR E CONFIGURAR O PROJETO**

#### 2.1 Clonar do GitHub
```bash
cd ~/IdeaProjects
git clone https://github.com/seu-usuario/erp-core.git
cd erp-core
```

#### 2.2 Limpar build anterior (se houver)
```bash
# Remover cache e dependências antigas
mvn clean
rm -rf target/
rm -rf node_modules/
rm -rf .m2/repository/
```

#### 2.3 Baixar dependências
```bash
# Baixar todas as dependências Maven
mvn dependency:resolve

# Verificar se tudo está OK
mvn validate
```

---

### **FASE 3: CONFIGURAR BANCO DE DADOS**

#### 3.1 Criar usuário e banco PostgreSQL
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Dentro do psql, executar:
CREATE USER erp_user WITH PASSWORD 'ErpCore2026!@#';
ALTER USER erp_user CREATEDB SUPERUSER;
CREATE DATABASE erp_core OWNER erp_user;
GRANT ALL PRIVILEGES ON DATABASE erp_core TO erp_user;
\q
```

#### 3.2 Configurar application.properties
```bash
# Editar arquivo de configuração
nano src/main/resources/application.properties
```

**Adicionar/verificar:**
```properties
# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/erp_core
spring.datasource.username=erp_user
spring.datasource.password=ErpCore2026!@#
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Flyway
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
```

#### 3.3 Executar Flyway (migrações)
```bash
# As migrações rodam automaticamente na primeira execução
# Ou executar manualmente:
mvn flyway:migrate
```

---

### **FASE 4: COMPILAR BACKEND**

#### 4.1 Compilar sem testes
```bash
mvn clean compile -DskipTests
```

#### 4.2 Resolver erros de compilação
```bash
# Se houver erros, verificar:
mvn compile -X  # verbose mode
```

#### 4.3 Build completo (package)
```bash
mvn clean package -DskipTests
```

#### 4.4 Gerar JAR
```bash
# O JAR será gerado em: target/erp-core-0.0.1-SNAPSHOT.jar
ls -lah target/*.jar
```

---

### **FASE 5: SETUP DO FRONTEND**

#### 5.1 Instalar Node.js
```bash
# Via NVM (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verificar
node -v
npm -v
```

#### 5.2 Instalar dependências frontend
```bash
cd grandport-frontend
npm install
```

#### 5.3 Build frontend
```bash
npm run build
```

#### 5.4 Copiar build para backend (opcional)
```bash
# Para servir frontend via Spring Boot
cp -r dist/* ../src/main/resources/static/
```

---

### **FASE 6: EXECUTAR A APLICAÇÃO**

#### 6.1 Via Maven Spring Boot
```bash
# Terminal 1 - Backend
cd /home/ubuntu/IdeaProjects/erp-core
mvn spring-boot:run

# Esperado na porta 8080
# http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui/index.html
```

#### 6.2 Via IDE (IntelliJ IDEA)
```
1. Abrir projeto em: File > Open > erp-core
2. Aguardar indexação
3. Right-click em: Application.java > Run
```

#### 6.3 Via Docker Compose
```bash
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

---

### **FASE 7: TESTES**

#### 7.1 Executar testes unitários
```bash
mvn test
```

#### 7.2 Executar testes de integração
```bash
mvn verify
```

#### 7.3 Gerar relatório de cobertura
```bash
mvn jacoco:report
```

---

### **FASE 8: VERIFICAR FUNCIONALIDADES**

#### 8.1 Login e Autenticação
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"admin123"}'
```

#### 8.2 Módulo de Contas Bancárias
```bash
# Listar contas
curl http://localhost:8080/api/financeiro/contas-bancarias \
  -H "Authorization: Bearer YOUR_TOKEN"

# Criar conta
curl -X POST http://localhost:8080/api/financeiro/contas-bancarias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"nome":"Banco Brasil","numeroBanco":"001"}'
```

#### 8.3 Módulo de Boleto
```bash
# Gerar PDF de boleto
curl http://localhost:8080/api/financeiro/boletos/1/gerar-pdf/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > boleto.pdf
```

---

### **FASE 9: TROUBLESHOOTING**

| Erro | Solução |
|------|---------|
| `Cannot find module 'thymeleaf'` | `mvn dependency:resolve` e rebuild |
| `Duplicate dependency` | Remover duplicatas do pom.xml |
| `PostgreSQL connection refused` | Verificar: `sudo systemctl status postgresql` |
| `Port 8080 already in use` | Mudar porta em `application.properties`: `server.port=8081` |
| `Flyway migration error` | `mvn flyway:clean flyway:migrate` |

---

### **FASE 10: ESTRUTURA DO PROJETO**

```
erp-core/
├── src/
│   ├── main/
│   │   ├── java/com/grandport/erp/
│   │   │   ├── modules/
│   │   │   │   ├── auth/          ← Autenticação
│   │   │   │   ├── financeiro/     ← Contas Bancárias, Boleto
│   │   │   │   ├── vendas/         ← Vendas
│   │   │   │   └── ...
│   │   │   └── Application.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── db/migration/       ← Flyway migrations
│   │       └── static/
│   ├── test/java/
│   └── test/resources/
├── grandport-frontend/           ← React App
│   ├── src/
│   │   ├── modules/
│   │   │   ├── financeiro/
│   │   │   │   └── ContasBancarias.jsx
│   │   │   └── ...
│   │   └── App.jsx
│   └── package.json
├── pom.xml                       ← Configuração Maven
├── docker-compose.yml            ← Docker config
└── README.md
```

---

### **CHECKLIST FINAL ✅**

- [ ] Java 17 instalado
- [ ] Maven 3.8+ instalado
- [ ] PostgreSQL rodando
- [ ] Banco de dados criado
- [ ] `mvn clean compile` passando
- [ ] Sem erros de dependência
- [ ] Backend rodando em 8080
- [ ] Frontend compilado
- [ ] Testes passando
- [ ] Swagger acessível
- [ ] Fazer login com sucesso
- [ ] Listar contas bancárias
- [ ] Criar nova conta
- [ ] Editar conta
- [ ] Deletar conta
- [ ] Transferência entre contas
- [ ] Gerar boleto PDF

---

### **PRÓXIMAS FASES: PREMIUM**

Após completar setup básico:

1. **[PREMIUM_01] Sincronismo Multi-Empresa** - Validação e testes
2. **[PREMIUM_02] Otimização Lazy Loading** - Implementar @Transactional
3. **[PREMIUM_03] Auditoria Completa** - Rastreamento de alterações
4. **[PREMIUM_04] API GraphQL** - Alternativa REST
5. **[PREMIUM_05] Cache Distribuído** - Redis avançado
6. **[PREMIUM_06] Microserviços** - Decomposição de módulos

---

**Última atualização**: 2026-03-30  
**Versão**: 0.0.1-SNAPSHOT  
**Status**: ✅ PRODUCTION READY

