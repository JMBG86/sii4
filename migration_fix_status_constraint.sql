-- Drop the existing constraint if it exists (handling potential naming variations)
ALTER TABLE diligencias DROP CONSTRAINT IF EXISTS diligencias_status_check;

-- Re-add the constraint with all required statuses
ALTER TABLE diligencias ADD CONSTRAINT diligencias_status_check 
CHECK (status IN ('a_realizar', 'realizado', 'enviado_aguardar'));
