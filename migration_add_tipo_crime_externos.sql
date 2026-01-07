-- Migration: Add tipo_crime to sp_inqueritos_externos
ALTER TABLE public.sp_inqueritos_externos 
ADD COLUMN IF NOT EXISTS tipo_crime text;

-- Optional: If we want to sync with existing records based on subject (assunto)
-- UPDATE public.sp_inqueritos_externos SET tipo_crime = assunto WHERE tipo_crime IS NULL;
