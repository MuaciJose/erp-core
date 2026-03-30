# Gerar JWT e Subir o Projeto

Este arquivo resume como:

- gerar um `JWT_SECRET` forte
- subir o projeto com bootstrap de admin
- usar o profile `local`
- verificar o usuario `admin` no PostgreSQL

## Linux

### 1. Gerar um JWT secret forte

```bash
openssl rand -base64 64
```

### 2. Entrar na pasta do projeto

```bash
cd ~/IdeaProjects/erp-core
```

### 3. Exportar as variaveis

```bash
export BOOTSTRAP_ADMIN_ENABLED=true
export BOOTSTRAP_ADMIN_USERNAME=admin
export BOOTSTRAP_ADMIN_PASSWORD='admin123'
export JWT_SECRET='cole-aqui-o-segredo-gerado'
```

### 4. Subir a aplicacao

```bash
mvn spring-boot:run
```

### Opcional: tudo em uma linha

```bash
cd ~/IdeaProjects/erp-core && \
BOOTSTRAP_ADMIN_ENABLED=true \
BOOTSTRAP_ADMIN_USERNAME=admin \
BOOTSTRAP_ADMIN_PASSWORD='admin123' \
JWT_SECRET='cole-aqui-o-segredo-gerado' \
mvn spring-boot:run
```

### Opcional: subir com profile `local`

```bash
cd ~/IdeaProjects/erp-core && \
BOOTSTRAP_ADMIN_ENABLED=true \
BOOTSTRAP_ADMIN_USERNAME=admin \
BOOTSTRAP_ADMIN_PASSWORD='admin123' \
JWT_SECRET='cole-aqui-o-segredo-gerado' \
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Opcional: persistir o `JWT_SECRET`

Adicione no `~/.bashrc` ou `~/.profile`:

```bash
export JWT_SECRET='cole-aqui-o-segredo-gerado'
```

## Windows CMD

### 1. Entrar na pasta do projeto

```cmd
cd C:\caminho\para\erp-core
```

### 2. Definir variaveis

```cmd
set BOOTSTRAP_ADMIN_ENABLED=true
set BOOTSTRAP_ADMIN_USERNAME=admin
set BOOTSTRAP_ADMIN_PASSWORD=admin123
set JWT_SECRET=cole-aqui-o-segredo-gerado
```

### 3. Subir a aplicacao

```cmd
mvn spring-boot:run
```

### Opcional: subir com profile `local`

```cmd
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## Windows PowerShell

### 1. Entrar na pasta do projeto

```powershell
cd C:\caminho\para\erp-core
```

### 2. Definir variaveis

```powershell
$env:BOOTSTRAP_ADMIN_ENABLED="true"
$env:BOOTSTRAP_ADMIN_USERNAME="admin"
$env:BOOTSTRAP_ADMIN_PASSWORD="admin123"
$env:JWT_SECRET="cole-aqui-o-segredo-gerado"
```

### 3. Subir a aplicacao

```powershell
mvn spring-boot:run
```

### Opcional: subir com profile `local`

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 4. Gerar um segredo forte no PowerShell

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Acesso ao Frontend

Depois de subir, abra:

```text
http://localhost:8080
```

Login esperado:

- usuario: `admin`
- senha: `admin123`

Importante:

- o bootstrap so cria o admin se ele ainda nao existir
- se o usuario `admin` ja existir no banco, o processo nao necessariamente recria ou troca a senha
- o profile padrao usa logs mais enxutos
- o profile `local` ativa logs mais detalhados para seguranca, SQL, Flyway e fiscal

## Verificar o Usuario Admin no PostgreSQL

### 1. Entrar no banco

```bash
psql -h localhost -U postgres -d grandport_erp
```

### 2. Listar usuarios

```sql
SELECT id, login, nome, email, ativo, empresa_id
FROM usuario
ORDER BY id;
```

### 3. Se a coluna de login tiver outro nome

```sql
SELECT *
FROM usuario
LIMIT 5;
```

### 4. Verificar se o admin existe

```sql
SELECT id, login, nome, email, ativo, empresa_id
FROM usuario
WHERE login = 'admin';
```

Se nao funcionar, teste:

```sql
SELECT *
FROM usuario
WHERE username = 'admin';
```

## Se o Admin Ja Existir

O bootstrap nao vai necessariamente recriar esse usuario.

Nesse caso, voce pode:

- usar a senha que ja esta no banco
- atualizar a senha, se souber como ela esta armazenada

## Descobrir Como a Senha Esta Salva

Tente:

```sql
SELECT id, login, senha
FROM usuario
WHERE login = 'admin';
```

Ou:

```sql
SELECT *
FROM usuario
WHERE login = 'admin';
```

Ou:

```sql
SELECT *
FROM usuario
WHERE username = 'admin';
```

Se a senha estiver em formato BCrypt, algo como:

```text
$2a$...
```

ou

```text
$2b$...
```

entao nao da para gravar texto puro. Voce precisa gerar um hash valido.

## Gerar Hash BCrypt no Linux

Se tiver o comando `htpasswd`:

```bash
htpasswd -bnBC 10 "" admin123 | tr -d ':\n'
```

Depois, no `psql`:

```sql
UPDATE usuario
SET senha = 'COLE_O_HASH_AQUI'
WHERE login = 'admin';
```

## Fluxo Mais Seguro

1. Verificar se o `admin` ja existe.
2. Se nao existir, subir com `BOOTSTRAP_ADMIN_ENABLED=true`.
3. Se existir, validar as colunas da tabela `usuario` e ajustar a senha corretamente.

## Consulta de Diagnostico

Se precisar inspecionar a estrutura real da tabela:

```sql
SELECT * FROM usuario LIMIT 3;
```
