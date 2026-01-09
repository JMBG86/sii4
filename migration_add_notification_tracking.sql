-- Add columns for Image Notification Tracking
ALTER TABLE sp_processos_crime 
ADD COLUMN IF NOT EXISTS notificacao_militar text,
ADD COLUMN IF NOT EXISTS notificacao_data_entrega timestamp with time zone,
ADD COLUMN IF NOT EXISTS notificacao_data_devolucao timestamp with time zone,
ADD COLUMN IF NOT EXISTS notificacao_resolvida boolean DEFAULT false;

-- Update existing records to sync resolvida with notificacao_imagens
UPDATE sp_processos_crime 
SET notificacao_resolvida = notificacao_imagens 
WHERE notificacao_imagens IS NOT NULL;
