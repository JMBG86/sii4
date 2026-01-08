-- Add 'idade' column to sp_cpcj to match process input
ALTER TABLE public.sp_cpcj 
ADD COLUMN IF NOT EXISTS idade integer;
