# 🚀 DEPLOYMENT GUIDE - GUIA DE DEPLOY

**Versão:** 1.0.0  
**Data:** 2026-03-30  
**Status:** ✅ Production-Ready

---

## 🎯 Opções de Deployment

### 1. **Local Development** (Desenvolvimento)
```bash
# Pré-requisitos: Java 21, PostgreSQL 15, Redis 7

# Clone
git clone https://github.com/seu-usuario/erp-core.git
cd erp-core

# Compile
./mvnw clean compile

# Execute
./mvnw spring-boot:run
```

**Acesso:** http://localhost:8080

---

### 2. **Docker Local** (Recomendado - Testes)
```bash
# Build + Run (tudo junto)
docker-compose up -d

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f erp-app

# Parar
docker-compose down
```

**Acesso:** http://localhost:8080

---

### 3. **Docker Hub Push** (Deploy em servidor)
```bash
# 1. Build local
./mvnw clean package -DskipTests
docker build -t erp-core:latest .

# 2. Tag para Docker Hub
docker tag erp-core:latest SEU_USUARIO/erp-core:1.0.0
docker tag erp-core:latest SEU_USUARIO/erp-core:latest

# 3. Login
docker login

# 4. Push
docker push SEU_USUARIO/erp-core:1.0.0
docker push SEU_USUARIO/erp-core:latest
```

---

### 4. **Deploy em Servidor Linux**

**SSH no servidor:**
```bash
ssh deploy@seu-servidor.com
cd /opt/erp-core
```

**Criar docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: grandport_erp
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - erp-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always
    networks:
      - erp-network

  erp-app:
    image: SEU_USUARIO/erp-core:latest
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/grandport_erp
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    restart: always
    networks:
      - erp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  erp-network:
```

**Criar .env:**
```
DB_USER=postgres
DB_PASSWORD=SENHA_SUPER_SEGURA
JWT_SECRET=CHAVE_JWT_SUPER_SECRETA
```

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### 5. **Kubernetes Deployment** (Escalável)

**k8s-namespace.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: erp-core
```

**k8s-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-app
  namespace: erp-core
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-app
  template:
    metadata:
      labels:
        app: erp-app
    spec:
      containers:
      - name: erp-app
        image: SEU_USUARIO/erp-core:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            configMapKeyRef:
              name: erp-config
              key: db-url
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: erp-secrets
              key: db-user
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: erp-secrets
              key: db-password
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: erp-app-service
  namespace: erp-core
spec:
  selector:
    app: erp-app
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**Deploy no K8s:**
```bash
# Criar namespace
kubectl apply -f k8s-namespace.yaml

# Criar secrets
kubectl create secret generic erp-secrets \
  --from-literal=db-user=postgres \
  --from-literal=db-password=SENHA \
  -n erp-core

# Criar deployment
kubectl apply -f k8s-deployment.yaml

# Verificar status
kubectl get pods -n erp-core
kubectl logs -f deployment/erp-app -n erp-core
```

---

### 6. **AWS Elastic Beanstalk** (CloudFormation)

**Criar eb-deployment.yaml:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ERP Core Application'

Resources:
  EBEnvironment:
    Type: 'AWS::ElasticBeanstalk::Environment'
    Properties:
      ApplicationName: erp-core
      EnvironmentName: erp-core-prod
      SolutionStackName: '64bit Amazon Linux 2 v5.7.6 running Docker'
      OptionSettings:
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: SPRING_DATASOURCE_URL
          Value: !Sub 'jdbc:postgresql://${RDSEndpoint}:5432/grandport_erp'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: StreamLogs
          Value: 'true'

  RDSDatabase:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:erp-db:SecretString:password}}'
      AllocatedStorage: '100'
```

---

## 📋 Pré-Flight Checklist

Antes de fazer deploy em produção, verifique:

```bash
# 1. Compilação
✅ ./mvnw clean package
# Resultado: target/erp-core-0.0.1-SNAPSHOT.jar

# 2. Testes
✅ ./mvnw test
# Resultado: 26 testes passando

# 3. Security scan
✅ ./mvnw org.owasp:dependency-check-maven:check
# Resultado: Sem vulnerabilidades críticas

# 4. Build Docker
✅ docker build -t erp-core:latest .
# Resultado: Imagem criada com sucesso

# 5. Health check
✅ docker run -p 8080:8080 erp-core:latest
curl http://localhost:8080/actuator/health
# Resultado: UP

# 6. Testes pós-deploy
✅ curl -X GET http://localhost:8080/api/financeiro/contas-bancarias \
  -H "Authorization: Bearer TOKEN"
# Resultado: 200 OK
```

---

## 🔒 Segurança em Produção

### Antes de fazer deploy:

1. **Mudar senhas padrão:**
```bash
DB_PASSWORD=SENHA_FORTE_32_CARACTERES
JWT_SECRET=CHAVE_SECRETA_SUPER_LONGA_256_BITS
ADMIN_PASSWORD=SENHA_ADMIN_FORTE
```

2. **HTTPS/TLS:**
```bash
# Usar Let's Encrypt com Nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d seu-dominio.com
```

3. **Firewall:**
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 8080  # Caso necessário
sudo ufw enable
```

4. **Secrets Manager:**
```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name erp-core/db-password \
  --secret-string SENHA_FORTE
```

5. **Monitoramento & Alertas:**
```bash
# Prometheus + Alertmanager
# Grafana para visualização
curl http://localhost:8080/actuator/prometheus
```

---

## 📊 Performance em Produção

### Recomendações:

```yaml
# JVM Tuning (Dockerfile)
ENV JAVA_OPTS="-Xmx2g -Xms1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Nginx reverse proxy
upstream backend {
  server erp-app:8080;
}

server {
  listen 80;
  server_name seu-dominio.com;
  
  location / {
    proxy_pass http://backend;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90;
  }
}

# Redis maxmemory policy
maxmemory 512mb
maxmemory-policy allkeys-lru

# PostgreSQL tuning
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

---

## 🚨 Troubleshooting Deploy

### Erro: Connection refused
```bash
# Verificar se banco está up
docker logs erp-postgres
# Reinicar
docker restart erp-postgres
```

### Erro: Out of memory
```bash
# Aumentar limite
docker run -m 1g SEU_USUARIO/erp-core:latest

# Ou em docker-compose
services:
  erp-app:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Erro: Permission denied
```bash
# Dar permissões corretas
sudo chown -R deploy:deploy /opt/erp-core
chmod 755 /opt/erp-core
```

---

## 📈 Monitoramento em Produção

```bash
# Health check
curl http://seu-dominio.com/actuator/health

# Métricas
curl http://seu-dominio.com/actuator/metrics

# Prometheus
curl http://seu-dominio.com/actuator/prometheus

# Logs
docker logs -f erp-app
tail -f /var/log/erp-core.log
```

---

## 🔄 CI/CD Automático (GitHub Actions)

Quando você fizer push:
1. ✅ Compila automaticamente
2. ✅ Executa testes
3. ✅ Análise de segurança
4. ✅ Build Docker
5. ✅ Push para Docker Hub
6. ✅ Deploy automático (se configurado)

---

**Deploy em ~15 minutos ✅ | Recomendação: Docker + Nginx + Let's Encrypt**

