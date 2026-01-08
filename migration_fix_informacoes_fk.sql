-- Fix FK to point to public.profiles instead of auth.users to allow joins
-- First drop the existing constraint (assuming default name, but using generic approach if possible or just try)
-- PostgREST needs the FK to be to the table we are joining (profiles)

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sp_informacoes_servico_user_id_fkey') THEN 
        ALTER TABLE public.sp_informacoes_servico DROP CONSTRAINT sp_informacoes_servico_user_id_fkey; 
    END IF; 
END $$;

ALTER TABLE public.sp_informacoes_servico
ADD CONSTRAINT sp_informacoes_servico_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id);
