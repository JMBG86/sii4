-- Add flags for Imagens feature
ALTER TABLE sp_processos_crime 
ADD COLUMN IF NOT EXISTS imagens_associadas boolean DEFAULT false;

ALTER TABLE sp_processos_crime 
ADD COLUMN IF NOT EXISTS notificacao_imagens boolean DEFAULT false;
