
-- Migration to add user_id ownership to SP tables for per-user reporting

-- 1. sp_processos_crime
ALTER TABLE public.sp_processos_crime 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_sp_processos_user_id ON public.sp_processos_crime(user_id);

-- 2. sp_inqueritos_externos (Deprecadas)
ALTER TABLE public.sp_inqueritos_externos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_sp_externos_user_id ON public.sp_inqueritos_externos(user_id);

-- 3. correspondencias
ALTER TABLE public.correspondencias 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_correspondencias_user_id ON public.correspondencias(user_id);
