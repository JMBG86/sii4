-- Add completion tracking fields to inqueritos table
ALTER TABLE public.inqueritos 
ADD COLUMN IF NOT EXISTS numero_oficio TEXT;

ALTER TABLE public.inqueritos 
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP WITH TIME ZONE;
