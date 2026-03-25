# 🔧 SOLUÇÃO: Erro 400 no Teste de Email

## ✅ Problema Corrigido

### 🔴 PROBLEMA
```
GET http://192.168.1.104:8080/api/fiscal/testar-email → 400 Bad Request
```

**Causa**: Endpoint retornava erro genérico sem informar o real problema

### ✅ SOLUÇÃO
Melhorei o tratamento de erro para fornecer mensagens úteis:

1. **Validação de Email**: Verifica se email está configurado
2. **Validação de Senha**: Verifica se senha de aplicativo está configurada
3. **Erro Descritivo**: Mostra exatamente qual é o problema
4. **Dicas Úteis**: Fornece passo-a-passo para resolver

---

## 🧪 Teste Agora

```bash
curl -X GET http://localhost:8080/api/fiscal/testar-email \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Possíveis Respostas

#### ✅ Sucesso (Email Configurado)
```json
{
  "status": "OK",
  "mensagem": "Conexão SMTP estabelecida com sucesso!",
  "email": "sua-empresa@gmail.com",
  "host": "smtp.gmail.com"
}
```

#### ❌ Email Não Configurado
```json
{
  "status": "ERRO",
  "mensagem": "Email remetente não configurado",
  "detalhes": "Vá em Configurações > Integrações e preencha o campo 'Email Remetente'"
}
```

#### ❌ Senha Não Configurada
```json
{
  "status": "ERRO",
  "mensagem": "Senha de email não configurada",
  "detalhes": "Vá em Configurações > Integrações e preencha o campo 'Senha de Aplicativo'"
}
```

#### ❌ Conexão Falhou
```json
{
  "status": "ERRO",
  "mensagem": "Falha ao conectar com servidor de email",
  "detalhes": "[erro específico]",
  "dicas": "1. Verifique se o email/senha estão corretos\n2. Ative a 'Senha de Aplicativo' se usar Gmail\n3. Verifique se a porta SMTP está correta (587 para Gmail)"
}
```

---

## 📋 Passo-a-Passo para Configurar Email

### 1. Ir em Configurações → Integrações

```
PUT /api/configuracoes
{
  "emailRemetente": "sua-empresa@gmail.com",
  "senhaEmailRemetente": "xxxx xxxx xxxx xxxx",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587
}
```

### 2. Testar Conexão

```bash
curl -X GET http://localhost:8080/api/fiscal/testar-email
```

### 3. Se usar Gmail

1. Ative 2FA em sua conta Google
2. Gere uma "Senha de Aplicativo" em https://myaccount.google.com/apppasswords
3. Use essa senha (16 caracteres) no campo "Senha de Aplicativo"

---

## ✅ Mudanças Aplicadas

**Arquivo**: `FiscalController.java` (linha 234)

**Antes**: Mensagem genérica "Falha SMTP"
**Depois**: Validações específicas com dicas

---

**Status**: ✅ CORRIGIDO
**Compilação**: ✅ SEM ERROS
**Teste Recomendado**: Sim (testar-email)

