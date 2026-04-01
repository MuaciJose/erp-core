ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS tipo_acesso VARCHAR(30) NOT NULL DEFAULT 'TENANT_USER';

UPDATE usuarios
SET tipo_acesso = 'PLATFORM_ADMIN'
WHERE username = 'admin';
