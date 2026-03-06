# 📦 GrandPort ERP

## Manual de Instalação — Motor WhatsApp (Evolution API v2)

Este guia explica como instalar e configurar o **motor de envio de WhatsApp do GrandPort ERP**, permitindo o envio automático de **orçamentos, recibos e mensagens para clientes**.

---

# 📋 Requisitos do Sistema

**Sistema Operacional**

* Linux (Ubuntu 20.04+ recomendado)
* Windows com Docker Desktop

**Dependências**

* Docker
* Docker Compose

**Recursos mínimos**

* 1GB de RAM dedicada aos containers

**Portas utilizadas**

| Porta | Serviço          |
| ----- | ---------------- |
| 8081  | API WhatsApp     |
| 5433  | Banco PostgreSQL |
| 6380  | Redis Cache      |

---

# 🛠️ Instalação

## 1️⃣ Criar pasta do serviço

Execute no terminal:

```
mkdir -p ~/grandport/api-whatsapp
cd ~/grandport/api-whatsapp
```

---

## 2️⃣ Criar arquivo docker-compose.yml

Crie o arquivo `docker-compose.yml` com o conteúdo abaixo:

```
version: '3.8'

networks:
  whatsapp_net:
    driver: bridge

services:

  evolution_db:
    image: postgres:15
    container_name: evolution_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: evolution
    ports:
      - "5433:5432"
    volumes:
      - evolution_db_data:/var/lib/postgresql/data
    networks:
      - whatsapp_net

  evolution_redis:
    image: redis:alpine
    container_name: evolution_redis
    restart: always
    ports:
      - "6380:6379"
    volumes:
      - evolution_redis_data:/data
    networks:
      - whatsapp_net

  evolution_api:
    image: atendai/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8081:8080"

    environment:
      SERVER_URL: http://localhost:8081
      AUTHENTICATION_TYPE: apikey
      AUTHENTICATION_API_KEY: MEU_TOKEN_SECRETO

      CONFIG_SESSION_PHONE_VERSION: 2.3000.1032750324

      DATABASE_PROVIDER: postgresql
      DATABASE_URL: postgresql://postgres:123456@evolution_db:5432/evolution?schema=public

      REDIS_URI: redis://evolution_redis:6379/1
      CACHE_REDIS_ENABLED: true
      CACHE_REDIS_URI: redis://evolution_redis:6379/2

      NODE_OPTIONS: --dns-result-order=ipv4first

    depends_on:
      - evolution_db
      - evolution_redis

    networks:
      - whatsapp_net

volumes:
  evolution_db_data:
  evolution_redis_data:
```

---

## 3️⃣ Iniciar os serviços

Execute:

```
sudo docker-compose up -d
```

Verifique se os containers estão ativos:

```
sudo docker ps
```

Containers esperados:

* evolution_api
* evolution_db
* evolution_redis

---

# ⚙️ Configuração no GrandPort ERP

Acesse o ERP no navegador.

Menu:

**Configurações → Integrações**

Preencha os dados técnicos:

| Campo      | Valor                                 |
| ---------- | ------------------------------------- |
| URL da API | http://localhost:8081                 |
| Token      | mesmo valor de AUTHENTICATION_API_KEY |

Clique em **Salvar Dados Técnicos**.

---

# 📱 Conectar o WhatsApp

1. No ERP clique em **Conectar Celular**
2. Um **QR Code aparecerá**
3. No celular:

WhatsApp → Aparelhos Conectados → Conectar um Aparelho

4. Escaneie o QR Code exibido no ERP.

Se tudo estiver correto o status será:

**CONECTADO**

---

# 🔧 Manutenção

**Ver logs**

```
sudo docker logs -f evolution_api
```

**Reiniciar API**

```
sudo docker-compose restart evolution_api
```

**Backup do banco**

```
sudo docker exec evolution_db pg_dump -U postgres evolution > backup_whatsapp.sql
```

---

# 🆘 Problemas Comuns

| Problema            | Solução                            |
| ------------------- | ---------------------------------- |
| QR Code não aparece | Verifique internet do servidor     |
| Erro 400 ao enviar  | Número deve ter DDI + DDD + número |
| Status Disconnected | Refazer pareamento                 |
| Erro de porta       | Alterar 8081 para outra porta      |

---

# 🔐 Segurança

Nunca compartilhe a variável:

AUTHENTICATION_API_KEY

Ela permite enviar mensagens usando o WhatsApp da empresa.

---

# 💡 Observação (Windows)

Se instalar em Windows:

1. Instale Docker Desktop
2. Ative virtualização (VT-x) na BIOS
3. Reinicie o computador

---

✅ Após concluir esses passos o **Motor WhatsApp do GrandPort ERP estará funcionando normalmente**.
