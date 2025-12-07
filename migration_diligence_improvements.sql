-- Migration: Diligence System Improvements
-- Description: Rename data_prevista to data_enviado and add status field

-- Add status column with default and constraint
ALTER TABLE diligencias 
ADD COLUMN status TEXT DEFAULT 'a_realizar' CHECK (status IN ('a_realizar', 'realizado'));

-- Rename data_prevista to data_enviado
ALTER TABLE diligencias 
RENAME COLUMN data_prevista TO data_enviado;

-- Update existing records to have default status
UPDATE diligencias 
SET status = 'a_realizar' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN diligencias.status IS 'Status da diligência: a_realizar (pendente) ou realizado (concluído)';
COMMENT ON COLUMN diligencias.data_enviado IS 'Data de envio da diligência (anteriormente data_prevista)';
