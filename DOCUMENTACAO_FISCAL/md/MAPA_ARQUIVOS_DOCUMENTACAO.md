# 🗺️ Mapa de Arquivos - Projeto ERP Core

## 📌 Localização dos Arquivos Documentação Criados

Todos os arquivos de documentação estão **na raiz do projeto** para fácil acesso:

```
/home/ubuntu/IdeaProjects/erp-core/
│
├─ 📄 QRCODE_WHATSAPP_PRONTO.md .................. LEIA PRIMEIRO! ✨
├─ 📄 DIAGNOSTICO_QRCODE_WHATSAPP.md ............ Análise técnica
├─ 📄 TESTE_QRCODE_WHATSAPP.md ................. Guia de teste
├─ 📄 TROUBLESHOOTING_QRCODE.md ................ Troubleshooting rápido
├─ 📄 RESUMO_CORRECOES_QRCODE.md ............... Sumário das mudanças
│
├─ 📁 evolution-api-folder/ ..................... Docker do WhatsApp
│  └─ docker-compose.yml ....................... Configurações Evolution
│
├─ 📁 grandport-frontend/ ....................... Frontend React
│  └─ src/modules/configuracoes/
│     └─ Configuracoes.jsx ..................... ✅ CORRIGIDO
│  └─ src/modules/vendas/
│     └─ OrcamentoPedido.jsx ................... ✅ CORRIGIDO
│
├─ 📁 src/main/java/com/grandport/erp/
│  └─ modules/vendas/service/
│     └─ WhatsAppService.java .................. ✅ CORRIGIDO
│  └─ modules/configuracoes/controller/
│     └─ WhatsAppController.java ............... Backend OK
│
└─ pom.xml .................................... Java dependencies
```

---

## 📖 Como Usar a Documentação

### 1️⃣ **Primeira Vez?**
👉 Leia: `QRCODE_WHATSAPP_PRONTO.md`

Este arquivo tem:
- ✅ Resumo da solução
- ✅ Como usar agora
- ✅ Checklist final

### 2️⃣ **Quer Entender o Problema?**
👉 Leia: `DIAGNOSTICO_QRCODE_WHATSAPP.md`

Este arquivo tem:
- 📋 Explicação técnica detalhada
- 🎯 Causa raiz do problema
- 📊 Estados possíveis do WhatsApp

### 3️⃣ **Precisa Testar?**
👉 Leia: `TESTE_QRCODE_WHATSAPP.md`

Este arquivo tem:
- 🧪 Teste passo-a-passo
- 🎥 Logs esperados
- 💡 Dicas profissionais

### 4️⃣ **Algo Deu Errado?**
👉 Leia: `TROUBLESHOOTING_QRCODE.md`

Este arquivo tem:
- 🆘 Problemas comuns
- 🔧 Soluções rápidas
- ⚡ Quick fix

### 5️⃣ **Quer Ver o Que Mudou?**
👉 Leia: `RESUMO_CORRECOES_QRCODE.md`

Este arquivo tem:
- ✅ Lista de correções
- 📝 Detalhes técnicos
- 🚀 Próximos passos opcionais

---

## 🔧 Arquivos Técnicos Modificados

### Frontend (React)

**`grandport-frontend/src/modules/configuracoes/Configuracoes.jsx`**
```javascript
// Alterações:
// 1. Rota: /api/vendas/whatsapp/status → /api/whatsapp/status
// 2. Função: solicitarQrCode() melhorada
// 3. Função: verificarConexaoAtiva() melhorada
// 4. Logs adicionados para debugging
```

**`grandport-frontend/src/modules/vendas/OrcamentoPedido.jsx`**
```javascript
// Alterações:
// 1. Rota: /api/vendas/whatsapp/status → /api/whatsapp/status
```

### Backend (Java)

**`src/main/java/com/grandport/erp/modules/vendas/service/WhatsAppService.java`**
```java
// Alterações:
// 1. solicitarQrCodeConexao() - Melhor tratamento de erros
// 2. consultarStatusInstancia() - Não mascara mais erros
// 3. Logging: System.out.println() e System.err.println()
// 4. Tipos genéricos: Map → Map<String, Object>
```

---

## 🎯 Estados do WhatsApp - Mapa Mental

```
WhatsApp Status
├─ open (✅ Conectado)
│  └─ Ação: Nenhuma
│
├─ AGUARDANDO_LEITURA (📱 QR code pronto)
│  └─ Ação: Apontar câmera do celular
│
├─ connecting (⏳ Conectando)
│  └─ Ação: Aguardar alguns segundos
│
├─ DESCONECTADO (❌ Não conectado)
│  └─ Ação: Gerar novo QR code
│
├─ ERRO_CONEXAO (❌ Erro HTTP)
│  └─ Ação: Verificar token e URL
│
└─ INDISPONIVEL (❌ API fora do ar)
   └─ Ação: Reiniciar Docker
```

---

## 🔄 Fluxo de Conexão

```
Usuário clica "Gerar QR Code"
          ↓
Frontend chama GET /api/whatsapp/qrcode
          ↓
Backend chama Evolution API /instance/connect/Padrao
          ↓
Evolution gera QR code e retorna Base64
          ↓
Frontend exibe imagem do QR code na tela
          ↓
Usuário aponta câmera do celular
          ↓
WhatsApp celular envia autorização
          ↓
Frontend chama GET /api/whatsapp/status periodicamente
          ↓
Backend retorna state: "open"
          ↓
Frontend mostra "✅ CONECTADO"
```

---

## 🧠 Lógica de Retry no Frontend

```
Tentativa 1-3 (rápido: 2 segundos)
       ↓
Tentativa 4-7 (normal: 3 segundos)
       ↓
Tentativa 8 (última chance)
       ↓
Se falhou: Mostrar erro detalhado
```

---

## 📊 Tabela de Rotas API

| Rota | Método | Função |
|------|--------|--------|
| `/api/whatsapp/qrcode` | GET | Gerar QR code |
| `/api/whatsapp/status` | GET | Consultar status |
| `/message/sendMedia/{instancia}` | POST | Enviar PDF via WhatsApp |
| `/instance/connect/{instancia}` | GET | Evolution: conectar |
| `/instance/connectionState/{instancia}` | GET | Evolution: verificar status |
| `/instance/logout/{instancia}` | DELETE | Evolution: desconectar |

---

## 🛠️ Comandos Úteis

```bash
# Ver Evolution rodando
docker ps | grep evolution

# Ver logs da Evolution
docker logs evolution_api

# Testar QR code via curl
TOKEN="MEU_TOKEN_SECRETO_123"
curl -H "apikey: $TOKEN" http://localhost:8081/instance/connect/Padrao

# Limpar sessão
curl -X DELETE -H "apikey: $TOKEN" \
  http://localhost:8081/instance/logout/Padrao

# Reiniciar Evolution
docker-compose -f evolution-api-folder/docker-compose.yml restart evolution-api

# Ver status do Java
lsof -i :8080
```

---

## 🎨 Estrutura de Pastas Completa

```
erp-core/
├─ QRCODE_WHATSAPP_PRONTO.md ✨ LEIA AQUI PRIMEIRO
├─ DIAGNOSTICO_QRCODE_WHATSAPP.md
├─ TESTE_QRCODE_WHATSAPP.md
├─ TROUBLESHOOTING_QRCODE.md
├─ RESUMO_CORRECOES_QRCODE.md
├─ MAPA_ARQUIVOS_DOCUMENTACAO.md ← Você está aqui
│
├─ evolution-api-folder/
│  ├─ docker-compose.yml
│  └─ ... (docker config)
│
├─ grandport-frontend/
│  ├─ package.json
│  ├─ src/
│  │  ├─ modules/
│  │  │  ├─ configuracoes/
│  │  │  │  └─ Configuracoes.jsx ✅
│  │  │  └─ vendas/
│  │  │     └─ OrcamentoPedido.jsx ✅
│  │  └─ ... (outros componentes)
│  └─ ... (frontend config)
│
├─ grandport-mobile/
│  └─ ... (app móvel)
│
├─ src/
│  └─ main/
│     ├─ java/
│     │  └─ com/grandport/erp/
│     │     ├─ modules/
│     │     │  ├─ configuracoes/
│     │     │  │  └─ controller/
│     │     │  │     └─ WhatsAppController.java
│     │     │  └─ vendas/
│     │     │     └─ service/
│     │     │        └─ WhatsAppService.java ✅
│     │     └─ ... (outras classes)
│     └─ resources/
│        └─ ... (configurações)
│
├─ pom.xml
├─ mvnw
├─ mvnw.cmd
└─ ... (outros arquivos)
```

---

## ✨ Sumário de Localização

| O que você precisa | Onde está | Ação |
|-------------------|-----------|------|
| Entender o problema | `DIAGNOSTICO_QRCODE_WHATSAPP.md` | Leia |
| Saber como testar | `TESTE_QRCODE_WHATSAPP.md` | Leia |
| Resolver erro rápido | `TROUBLESHOOTING_QRCODE.md` | Leia |
| Ver mudanças feitas | `RESUMO_CORRECOES_QRCODE.md` | Leia |
| Começar agora | `QRCODE_WHATSAPP_PRONTO.md` | Leia |
| Modificar código frontend | `grandport-frontend/src/modules/` | Edite |
| Modificar código backend | `src/main/java/com/grandport/erp/` | Edite |
| Configurar Evolution | `evolution-api-folder/docker-compose.yml` | Edite |
| Compilar projeto | Raiz do projeto | `mvn clean compile` |

---

**Criado em:** 2026-03-21
**Versão:** 1.0

