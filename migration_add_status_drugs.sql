-- Add status tracking columns to sp_apreensoes_drogas
ALTER TABLE public.sp_apreensoes_drogas
ADD COLUMN IF NOT EXISTS entregue_lpc boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_entrega date;
