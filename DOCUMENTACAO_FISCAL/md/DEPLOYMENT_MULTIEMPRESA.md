# 🚀 GUIA PRÁTICO: DEPLOY MULTI-EMPRESA PARA PRODUÇÃO

## ⚠️ PRÉ-DEPLOYMENT (CRÍTICO)

### 1. Fazer Backup Completo (15 minutos)

```bash
# Backup do banco de dados
mysqldump -u root -p grandport_erp > /backup/erp_antes_multiempresa_$(date +%Y%m%d_%H%M%S).sql

# Backup do código (git)
cd /home/ubuntu/IdeaProjects/erp-core
git add -A
git commit -m "Backup antes de deploy multi-empresa"
git tag backup-pre-multiempresa-$(date +%Y%m%d)
```

### 2. Documentar Versão Anterior

```bash
# Copiar aplicação em execução
cp -r /opt/erp-core /opt/erp-core-backup-$(date +%Y%m%d_%H%M%S)

# Documentar versão atual
java -jar /opt/erp-core/app.jar --version > /backup/version-anterior.txt
```

---

## 📊 TESTE PRÉ-DEPLOYMENT (30 minutos)

### Passo 1: Executar Diagnóstico SQL

```sql
-- Conectar ao banco de dados
mysql -u root -p grandport_erp

-- VERIFICAR ESTRUTURA
SELECT COUNT(*) as total FROM produtos;
SELECT COUNT(DISTINCT empresa_id) as total_empresas FROM produtos;

-- VERIFICAR ISOLAMENTO ATUAL
SELECT empresa_id, COUNT(*) as total
FROM produtos
GROUP BY empresa_id;

-- Resultado esperado: todos têm empresa_id preenchido
```

### Passo 2: Compilar e Testar Localmente

```bash
# No seu PC/Dev:
cd /home/ubuntu/IdeaProjects/erp-core

# Compilar
mvn clean package -DskipTests

# Se compilou sem erros → ✅ OK para deploy
# Se teve erros → ❌ Não deploy, corrija primeiro
```

### Passo 3: Testar Endpoints Novo

```bash
# Iniciar aplicação localmente
java -jar target/erp-core-0.0.1-SNAPSHOT.jar

# Em outro terminal, testar novo endpoint (PASSO 1 & 2 não têm endpoints)
curl -X GET http://localhost:8080/api/produtos \
  -H "Authorization: Bearer SEU_TOKEN"

# Deve retornar: Lista de produtos da sua empresa
# Verifique se veio apenas dados da sua empresa!
```

---

## 🚀 DEPLOYMENT SEGURO (Rolling Restart - Zero Downtime)

### Opção 1: Docker/Kubernetes (Recomendado)

```bash
# Build nova imagem
docker build -t erp-core:multiempresa .

# Deploy com rolling restart (0 downtime)
kubectl set image deployment/erp-core \
  erp-core=erp-core:multiempresa \
  --record
```

### Opção 2: Server Tradicional (Linux)

```bash
# 1. Parar a aplicação
sudo systemctl stop erp-core

# 2. Fazer backup do JAR atual
cp /opt/erp-core/app.jar /opt/erp-core/app.jar.backup-$(date +%Y%m%d)

# 3. Copiar novo JAR
cp /home/ubuntu/IdeaProjects/erp-core/target/erp-core-0.0.1-SNAPSHOT.jar \
   /opt/erp-core/app.jar

# 4. Iniciar novamente
sudo systemctl start erp-core

# 5. Verificar status
sudo systemctl status erp-core

# 6. Acompanhar logs
tail -f /var/log/erp-core/application.log
```

### Opção 3: Blue-Green Deployment (Mais Seguro)

```bash
# Terminal 1: Aplicação ANTIGA rodando na porta 8080
java -jar /opt/erp-core/app.jar --server.port=8080

# Terminal 2: Aplicação NOVA rodando na porta 8081
java -jar /home/ubuntu/IdeaProjects/erp-core/target/erp-core-0.0.1-SNAPSHOT.jar \
  --server.port=8081

# Terminal 3: Redirecionar tráfego (nginx)
# Editar /etc/nginx/sites-available/erp
# upstream backend { server localhost:8081; }
sudo systemctl reload nginx

# Após validar que tudo funciona:
# upstream backend { server localhost:8080; }
# (switch back se houver problema)
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOYMENT (30 minutos)

### 1. Verificar Aplicação Está Rodando

```bash
# Confirmar que app iniciou sem erros
curl http://localhost:8080/actuator/health

# Esperado: {"status":"UP"}
```

### 2. Testar Isolamento de Dados

```bash
# Testar com 2 usuários diferentes

# Terminal 1: Usuário Empresa 1
curl -X GET http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_EMPRESA_1" | jq '.length'

# Terminal 2: Usuário Empresa 2
curl -X GET http://localhost:8080/api/produtos \
  -H "Authorization: Bearer TOKEN_EMPRESA_2" | jq '.length'

# Verificar: As listas são diferentes? ✅ OK
# Se iguais: ❌ PROBLEMA - reverter!
```

### 3. Testar Novos Métodos (Repository)

```bash
# Script de teste simples
curl -X GET "http://localhost:8080/api/produtos/alertas?empresaId=1" \
  -H "Authorization: Bearer TOKEN"

# Deve retornar: Produtos com baixo estoque APENAS da empresa 1
```

### 4. Monitorar Logs por Erros

```bash
# Verificar logs por 5 minutos
tail -f /var/log/erp-core/application.log | head -100

# Procurar por:
# ✅ "🏢 Empresa do usuário: 1" (bom!)
# ❌ "Erro ao extrair empresa" (problema)
# ❌ Exception (parar e investigar)
```

### 5. Verificar Banco de Dados

```sql
-- Verificar que repositórios estão usando novos métodos
SELECT COUNT(*) FROM produtos WHERE empresa_id = 1;

-- Verificar performance (tempo de query)
SHOW PROFILES;

-- Criar índices se não existirem
CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX idx_vendas_empresa_id ON vendas(empresa_id);
```

---

## 📊 MONITORAMENTO EM TEMPO REAL (Primeira Hora)

### Dashboard de Saúde

```bash
# Monitorar CPU, Memória, Conexões BD
watch -n 1 'curl http://localhost:8080/actuator/metrics/system.cpu.usage'

# Monitorar conexões ativas
watch -n 5 'mysql -u root -p -e "SHOW PROCESSLIST;"'
```

### Alertas de Erro

```bash
# Configurar monitoramento
tail -f /var/log/erp-core/application.log | grep -i "error\|exception"

# Se muitos erros aparecerem nos primeiros 5 min:
# 1. Parar aplicação
# 2. Restaurar versão anterior
# 3. Investigar logs
```

---

## 🔙 ROLLBACK DE EMERGÊNCIA (Se der problema)

### Passo 1: Parar Aplicação

```bash
sudo systemctl stop erp-core
# ou
pkill -f "erp-core.*jar"
```

### Passo 2: Restaurar Código Anterior

```bash
# Restaurar de backup
cp /opt/erp-core/app.jar.backup-20260324 /opt/erp-core/app.jar

# Ou com git
cd /home/ubuntu/IdeaProjects/erp-core
git reset --hard HEAD~1
mvn clean package -DskipTests
cp target/erp-core-0.0.1-SNAPSHOT.jar /opt/erp-core/app.jar
```

### Passo 3: Restaurar Banco (se modificou dados)

```bash
# Restaurar backup
mysql -u root -p grandport_erp < /backup/erp_antes_multiempresa_20260324_143022.sql
```

### Passo 4: Reiniciar Aplicação

```bash
sudo systemctl start erp-core
tail -f /var/log/erp-core/application.log
```

### Passo 5: Confirmar Funciona

```bash
curl http://localhost:8080/actuator/health
# Esperado: {"status":"UP"}
```

---

## 🎯 CHECKLIST DE DEPLOYMENT

```
PRÉ-DEPLOYMENT
[ ] Fazer backup completo (banco + código)
[ ] Documentar versão anterior
[ ] Testar compilação (mvn clean package)
[ ] Testar isolamento de dados localmente
[ ] Revisar logs para warnings/errors
[ ] Comunicar com time

DEPLOYMENT
[ ] Parar aplicação (graceful shutdown)
[ ] Fazer backup do JAR em produção
[ ] Copiar novo JAR
[ ] Iniciar aplicação
[ ] Verificar startup sem erros (30 segundos)
[ ] Monitorar logs (5 minutos)

PÓS-DEPLOYMENT
[ ] Testar endpoint GET /api/produtos (ambas empresas)
[ ] Verificar isolamento de dados
[ ] Monitorar performance (CPU, RAM, BD)
[ ] Validar alertas de erro (nenhum?)
[ ] Comunicar sucesso ao time
[ ] Manter vigilância por 1 hora
```

---

## 🆘 TROUBLESHOOTING

### Problema: "Erro ao compilar"
```
Solução:
1. mvn clean install
2. Verificar Java version (deve ser 17+)
3. Verificar dependências com mvn dependency:tree
```

### Problema: "Conexão recusada ao banco"
```
Solução:
1. Verificar connection string em application.yaml
2. Verificar credenciais de BD
3. Verificar firewall/security groups
4. Testar: mysql -u root -p -h localhost
```

### Problema: "Isolamento de dados não funciona"
```
Solução:
1. Verificar que usuário tem empresaId preenchido
2. Verificar TenantResolver está ativado
3. Verificar novo método está sendo chamado
4. Fazer rollback e investigar
```

### Problema: "Performance piora depois de deploy"
```
Solução:
1. Criar índices em empresa_id:
   CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
   CREATE INDEX idx_vendas_empresa_id ON vendas(empresa_id);
2. Analisar query com EXPLAIN PLAN
3. Aumentar pool de conexões
```

---

## 📞 CONTATO DE EMERGÊNCIA

Se houver problema durante deployment:

1. **Parar tudo** - `sudo systemctl stop erp-core`
2. **Fazer rollback** - Restaurar versão anterior
3. **Investigar logs** - `/var/log/erp-core/application.log`
4. **Abrir ticket** - Documentar erro exato
5. **Retentar** - Após correção

---

## ✨ SUCESSO DO DEPLOYMENT

Quando tudo funciona:

✅ Aplicação inicia sem erros
✅ Endpoints /api/produtos retornam dados corretos
✅ Isolamento de dados funciona (empresa 1 ≠ empresa 2)
✅ Logs mostram "🏢 Empresa do usuário: X"
✅ Sem exceções nos primeiros 5 minutos
✅ Performance está OK (< 200ms por query)

**Parabéns! Multi-empresa está em produção! 🎉**

---

**Data do Deploy**: 2026-03-24
**Versão**: erp-core 0.0.1-SNAPSHOT + Multi-Empresa Phase 1
**Crítico**: Manter backups por 7 dias antes de deletar

