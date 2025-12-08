-- Remove old column
ALTER TABLE public.inqueritos DROP COLUMN IF EXISTS localizacao;

-- Add new JSONB columns for multiple parties
ALTER TABLE public.inqueritos ADD COLUMN IF NOT EXISTS denunciantes JSONB DEFAULT NULL;
ALTER TABLE public.inqueritos ADD COLUMN IF NOT EXISTS denunciados JSONB DEFAULT NULL;

-- Comment on columns for clarity (optional but good practice)
COMMENT ON COLUMN public.inqueritos.denunciantes IS 'Array of names of complainants [{"nome": "..."}] or simple string array';
COMMENT ON COLUMN public.inqueritos.denunciados IS 'Array of names of defendants [{"nome": "..."}] or simple string array';
