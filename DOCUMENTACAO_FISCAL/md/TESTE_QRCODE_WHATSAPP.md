# 🧪 Guia Prático para Testar QR Code WhatsApp

## ⚡ Quick Start (3 passos)

### 1️⃣ Verificar se Evolution está rodando
```bash
# No terminal, na pasta erp-core
docker-compose -f evolution-api-folder/docker-compose.yml ps

# Deve mostrar:
# evolution_api    | Running | 0.0.0.0:8081->8080/tcp
```

**Se NÃO estiver rodando:**
```bash
cd evolution-api-folder
docker-compose up -d
# Aguardar 10-15 segundos para iniciar
```

### 2️⃣ Testar conexão com Evolution (via terminal)
```bash
# Substitua pelo seu token real
TOKEN="MEU_TOKEN_SECRETO_123"

# Teste 1: Ver estado da instância
curl -H "apikey: $TOKEN" http://localhost:8081/instance/connectionState/Padrao

# Teste 2: Solicitar QR code
curl -H "apikey: $TOKEN" http://localhost:8081/instance/connect/Padrao
```

**Esperado:** Resposta JSON com dados ou erro detalhado.

### 3️⃣ Testar no Frontend
1. Abrir http://localhost:3000 (Frontend)
2. Ir para **Configurações > WhatsApp**
3. Verificar se os dados estão corretos:
   - URL API: `http://localhost:8081`
   - Token: `MEU_TOKEN_SECRETO_123`
   - Instância: `Padrao`
4. Clicar **"Gerar QR Code"**
5. **Abrir F12 (DevTools) > Console** para ver logs

---

## 🔍 Checklist de Troubleshooting

### ✅ Container Evolution não está rodando?
```bash
docker-compose -f evolution-api-folder/docker-compose.yml logs evolution-api | tail -20
```

### ✅ Token está errado?
Verificar em `evolution-api-folder/docker-compose.yml`:
```yaml
AUTHENTICATION_API_KEY=MEU_TOKEN_SECRETO_123  # ← Este token
```

### ✅ Não consegue conectar em localhost:8081?
```bash
# Testar conectividade
curl http://localhost:8081/instance/health

# Se der erro, o container pode estar com problema
docker restart evolution_api
```

### ✅ QR code não aparece mesmo com token correto?
1. Abrir **F12 > Console** e procurar por:
   - `📦 RESPOSTA DA EVOLUTION:` - Ver resposta completa
   - `❌ ERRO DA EVOLUTION:` - Ver erro
   - `Tentativa 1/8` - Ver quantas tentativas fez

2. Abrir **Terminal Backend** e procurar por:
   - `✅ QR CODE GERADO COM SUCESSO:` - Sucesso!
   - `❌ ERRO DA EVOLUTION (QR CODE):` - Erro detalhado

### ✅ Celular diz "Sessão expirada"?
Limpar a sessão anterior:
```bash
curl -X DELETE \
  -H "apikey: MEU_TOKEN_SECRETO_123" \
  http://localhost:8081/instance/logout/Padrao

# Depois tentar gerar novo QR code
```

### ✅ Erro "type longtext does not exist"?
Este é um erro PostgreSQL diferente. Verifique se você rodou as migrações corretas do banco de dados.

---

## 📱 Processo Completo de Conexão

```
[1] Abrir Configurações WhatsApp
              ↓
[2] Clicar "Gerar QR Code"
              ↓
[3] Frontend chama GET /api/whatsapp/qrcode
              ↓
[4] Backend chama Evolution API: /instance/connect/Padrao
              ↓
[5] Evolution gera QR code e retorna Base64
              ↓
[6] Frontend exibe QR code em tela
              ↓
[7] Celular aponta câmera para QR code
              ↓
[8] WhatsApp celular envia autorização
              ↓
[9] Frontend chama GET /api/whatsapp/status
              ↓
[10] Backend retorna state: "open"
              ↓
[11] Frontend mostra "✅ CONECTADO"
```

---

## 🎥 Logs Esperados

### ✅ Sucesso Total

**Terminal Java:**
```
✅ QR CODE GERADO COM SUCESSO: {qrcode: {base64: "data:image/png;base64,iVBORw..."}}
✅ STATUS EVOLUTION: {instance: {state: "open"}}
```

**F12 Console:**
```
📦 RESPOSTA DA EVOLUTION: {qrcode: {base64: "..."}}
📦 RESPOSTA DO STATUS: {instance: {state: "open"}}
✅ WhatsApp está ONLINE e funcionando!
```

### ❌ Erro - Conexão Recusada

**Terminal Java:**
```
❌ ERRO GERAL (QR CODE): Connection refused: localhost/127.0.0.1:8081
```

**Solução:** Reiniciar Docker
```bash
docker-compose -f evolution-api-folder/docker-compose.yml restart evolution-api
```

### ❌ Erro - Token Inválido

**Terminal Java:**
```
❌ ERRO DA EVOLUTION (QR CODE): 401 UNAUTHORIZED
❌ STATUS HTTP: 401
```

**Solução:** Verificar token em `evolution-api-folder/docker-compose.yml`

### ❌ Erro - Instância não encontrada

**Terminal Java:**
```
❌ ERRO DA EVOLUTION (QR CODE): 404 NOT FOUND - Instance not found
```

**Solução:** Criar nova instância ou usar nome correto

---

## 🚀 Dicas Profissionais

### 1. Lipar tudo e começar do zero
```bash
# Parar tudo
docker-compose -f evolution-api-folder/docker-compose.yml down

# Remover volumes (dados antigos)
docker volume rm evolution_db_data evolution_redis_data 2>/dev/null || true

# Iniciar novamente
docker-compose -f evolution-api-folder/docker-compose.yml up -d

# Aguardar 15 segundos
sleep 15

# Verificar se está ok
docker-compose -f evolution-api-folder/docker-compose.yml ps
```

### 2. Monitorar logs em tempo real
```bash
docker-compose -f evolution-api-folder/docker-compose.yml logs -f evolution-api
```

### 3. Entrar no container para debugar
```bash
docker exec -it evolution_api bash

# Dentro do container:
ps aux | grep node
netstat -tuln | grep 8080
```

### 4. Verificar estado do banco de dados
```bash
docker exec -it evolution_db psql -U postgres -d evolution -c \
  "SELECT instance_name, state FROM instances LIMIT 10;"
```

---

## 📞 Contato com Suporte

Se após seguir este guia ainda não funcionar:

1. Coletar logs:
   ```bash
   docker-compose -f evolution-api-folder/docker-compose.yml logs evolution-api > evolution_logs.txt
   ```

2. Informações do sistema:
   ```bash
   echo "=== Docker ===" && docker --version && docker-compose --version
   echo "=== Java ===" && java -version
   echo "=== Node ===" && node --version npm --version
   ```

3. Relatar com:
   - Arquivo `evolution_logs.txt`
   - Output dos comandos acima
   - Screenshot do erro em F12
   - Comando exato que está dando erro

---

**Última atualização:** 2026-03-21
**Versão:** 1.0

