/* Safe Migration for Diligencias */
/* Run this if the previous migration failed */

/* 1. Add 'status' column safely */
ALTER TABLE public.diligencias 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'a_realizar';

/* 2. Add 'data_enviado' column safely */
ALTER TABLE public.diligencias 
ADD COLUMN IF NOT EXISTS data_enviado date;

/* 3. (Optional) Drop data_prevista if it exists and you want to clean up, otherwise leave it */
/* ALTER TABLE public.diligencias DROP COLUMN IF EXISTS data_prevista; */
