-- Migration: Update Diligence Status Check Constraint
-- Description: Add 'enviado_aguardar' to the allowed status values for diligencias

-- Drop the existing check constraint
ALTER TABLE diligencias 
DROP CONSTRAINT IF EXISTS diligencias_status_check;

-- Add the new check constraint with the additional state
ALTER TABLE diligencias 
ADD CONSTRAINT diligencias_status_check 
CHECK (status IN ('a_realizar', 'realizado', 'enviado_aguardar'));

-- Update comment
COMMENT ON COLUMN diligencias.status IS 'Status da diligência: a_realizar, realizado, ou enviado_aguardar';
