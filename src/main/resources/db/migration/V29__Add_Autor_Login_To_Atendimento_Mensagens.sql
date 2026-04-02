ALTER TABLE atendimento_mensagens
    ADD COLUMN IF NOT EXISTS autor_login VARCHAR(160);
