# ⚡ Quick Troubleshooting - QR Code WhatsApp

## 🚨 Problema: "QR code não aparece"

### Passo 1: Evolution está rodando?
```bash
docker ps | grep evolution_api
```
**Se não aparecer:** `docker-compose -f evolution-api-folder/docker-compose.yml up -d`

---

### Passo 2: Abrir F12 > Console
Clicar "Gerar QR Code" e procurar por uma destas mensagens:

#### ✅ Sucesso
```
📦 RESPOSTA DA EVOLUTION: {qrcode: {base64: "data:image/png;base64,..."}}
```
**Ação:** QR code deve aparecer na tela. Apontar celular.

#### ❌ Erro: "ERRO_CONEXAO"
```
📦 RESPOSTA DA EVOLUTION: {instance: {state: "ERRO_CONEXAO", statusCode: 401}}
```
**Ação:** Token está errado. Verificar:
1. `evolution-api-folder/docker-compose.yml`
2. Campo `AUTHENTICATION_API_KEY`
3. Copiar este valor em Configurações > WhatsApp > Token

#### ❌ Erro: "Connection refused"
```
❌ ERRO AO SOLICITAR QR CODE: Error: connect ECONNREFUSED 127.0.0.1:8081
```
**Ação:** Evolution não está rodando. Execute:
```bash
docker-compose -f evolution-api-folder/docker-compose.yml restart evolution-api
sleep 15
```

#### ❌ Erro: "Instância não encontrada"
```
❌ ERRO AO SOLICITAR QR CODE: 404 Instance not found
```
**Ação:** Nome da instância está errado. Verificar campo "Instância" em Configurações > WhatsApp. Deve ser `Padrao`.

---

## 🔄 Problema: "Mostra conectado mas celular não está"

### Passo 1: Verificar status real
```bash
# No terminal
TOKEN="MEU_TOKEN_SECRETO_123"
curl -H "apikey: $TOKEN" http://localhost:8081/instance/connectionState/Padrao
```

**Esperado:**
```json
{"instance": {"state": "open"}}
```

Se retornar erro → Há problema com Evolution.

### Passo 2: Desconectar e reconectar
```bash
TOKEN="MEU_TOKEN_SECRETO_123"

# Desconectar
curl -X DELETE -H "apikey: $TOKEN" \
  http://localhost:8081/instance/logout/Padrao

# Aguardar 3 segundos
sleep 3

# Tentar reconectar pelo frontend
```

### Passo 3: Se ainda não funcionar
```bash
# Reiniciar tudo
docker-compose -f evolution-api-folder/docker-compose.yml down
docker volume rm evolution_db_data evolution_redis_data 2>/dev/null || true
docker-compose -f evolution-api-folder/docker-compose.yml up -d
sleep 15

# Testar novamente
```

---

## 🎥 Problema: "Gera QR code mas celular não consegue ler"

### Passo 1: Verificar qualidade do QR
1. Abrir F12 > Console
2. Copiar todo o valor de `base64:`
3. Colar em um decodificador online (ex: https://codebeautify.org/base64-to-image)
4. Ver se a imagem do QR está nítida

### Passo 2: Tentar novamente
- Clicar "Gerar QR Code" novamente
- Aguardar 5 segundos antes de apontar celular
- QR code expira em ~20 segundos

### Passo 3: Se ainda não funcionar
- Desconectar do WhatsApp Web em outro computador
- Tentar gerar novo QR code
- Reiniciar Evolution se necessário

---

## 📱 Problema: "Celular diz 'Sessão expirada'"

```bash
TOKEN="MEU_TOKEN_SECRETO_123"

# Limpar sessão antiga
curl -X DELETE -H "apikey: $TOKEN" \
  http://localhost:8081/instance/logout/Padrao

# No frontend: Gerar novo QR Code
```

---

## 🛠️ Problema: "Erro ao compilar - Raw use of Map"

Já foi corrigido! Se ainda aparecer:
```bash
cd /home/ubuntu/IdeaProjects/erp-core
mvn clean compile -q
```

---

## 📊 Checklist Completo

- [ ] Evolution rodando: `docker ps | grep evolution_api`
- [ ] Token correto em `evolution-api-folder/docker-compose.yml`
- [ ] Configurações preenchidas:
  - [ ] URL: `http://localhost:8081`
  - [ ] Token: Igual ao do docker-compose
  - [ ] Instância: `Padrao`
- [ ] F12 > Console aberto durante testes
- [ ] Apontando câmera do celular para QR code
- [ ] WhatsApp do celular em versão atualizada

---

## 🆘 Contato com Suporte

Se nada funcionar, forneça:

1. **Output do Docker:**
   ```bash
   docker-compose -f evolution-api-folder/docker-compose.yml logs evolution-api | tail -50
   ```

2. **Output do Frontend (F12 > Console):**
   - Screenshot ou cópia do erro

3. **Teste de conectividade:**
   ```bash
   curl -v http://localhost:8081/instance/health
   ```

4. **Versões:**
   ```bash
   docker --version
   java -version
   node --version
   ```

---

**Versão:** 1.0
**Data:** 2026-03-21

