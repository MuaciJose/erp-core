ALTER TABLE atendimento_mensagens
    ADD COLUMN IF NOT EXISTS autor_perfil VARCHAR(80);
