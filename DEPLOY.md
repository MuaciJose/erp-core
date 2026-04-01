# Deploy

Este projeto agora trata Redis como dependencia obrigatoria em `hml/producao`.

## Stack

- `postgres`
- `redis`
- `erp-app`

O deploy padrao usa [docker-compose.yml](/home/ubuntu/IdeaProjects/erp-core/docker-compose.yml).

## Pre-requisitos

- Docker
- Docker Compose plugin (`docker compose`)
- Porta `8080` liberada para a API
- Portas `5432` e `6379` expostas apenas se voce realmente precisar acesso externo

## Variaveis obrigatorias

Copie [.env.example](/home/ubuntu/IdeaProjects/erp-core/.env.example) para `.env` e ajuste no minimo:

```env
SPRING_PROFILES_ACTIVE=hml
JWT_SECRET=troque-por-uma-chave-longa-e-segura
APP_SECURITY_REDIS_REQUIRED=true
APP_SECURITY_COOKIE_SECURE=true
APP_API_BASE_URL=https://api.seu-dominio.com
POSTGRES_PASSWORD=uma-senha-forte
```

## Subida

Build do jar:

```bash
./mvnw clean package -DskipTests
```

Subida da stack:

```bash
docker compose up -d --build
```

## Verificacao

Containers:

```bash
docker compose ps
```

Logs do backend:

```bash
docker compose logs -f erp-app
```

Healthcheck:

```bash
curl http://localhost:8080/actuator/health
```

## Comportamento esperado

- Se `APP_SECURITY_REDIS_REQUIRED=true` e Redis nao estiver disponivel, o backend falha no startup.
- Em `local/test`, a aplicacao pode usar fallback em memoria.
- Em `hml/producao`, o comportamento correto e exigir Redis.

## Checklist pos-deploy

1. Confirmar `docker compose ps` com `postgres`, `redis` e `erp-app` saudaveis.
2. Validar `/actuator/health`.
3. Fazer login no ERP.
4. Validar fluxo de MFA.
5. Confirmar que cookie de autenticacao foi emitido.
6. Validar uma rota autenticada apos refresh da pagina.
7. Confirmar que `APP_API_BASE_URL` aponta para o dominio correto.

## Rollback basico

Se o deploy novo falhar:

```bash
docker compose down
```

Volte para a revisao/tag anterior, gere o jar novamente e suba:

```bash
./mvnw clean package -DskipTests
docker compose up -d --build
```

## Observacoes

- Nao use `.env` versionado.
- Em producao, prefira TLS/HTTPS na frente da API.
- Se o frontend estiver em dominio diferente, alinhe CORS e `SameSite` do cookie.
